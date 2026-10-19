import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { PaperCard } from '@/components/screens/recipe/PaperCard';
import { SaveSheet } from '@/components/screens/recipe/SaveSheet';
import { ShareDialog } from '@/components/screens/recipe/ShareDialog';
import { ShoppingSheet } from '@/components/screens/recipe/ShoppingSheet';
import { TipCard } from '@/components/screens/recipe/TipCard';
import { ActionMenu, AppText, Button, Dialog, IconButton, SegmentedTabs, TimerPill, Toast } from '@/components/ui';
import { CREATORS, formatIngredient, type Recipe } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { color, font, radius, shadow, space } from '@/theme/tokens';

type Tab = 'ingredients' | 'steps';

const TABS = [
  { value: 'ingredients', label: 'Ingrédients', icon: 'ingredients' },
  { value: 'steps', label: 'Recette', icon: 'recipe' },
] as const;

/** Hauteur de la photo floutée derrière le hero (Figma : 244 px sous la barre d'état). */
const BLUR_HEIGHT = 244;
/** Assez fort pour gommer les détails, assez faible pour garder les couleurs du plat (Android plafonne à 25). */
const BLUR_RADIUS = 20;
/** Place laissée sous la dernière étape pour le bouton flottant « Démarrer la recette ». */
const CTA_SPACE = 48 + space[16] * 2;

type Timer = { remaining: number; running: boolean };

/** Figma : pages « Recette » onglets Ingrédients (191:4705) et Étapes (191:4824). */
export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes, removeRecipe, addToShoppingList } = useRecipes();
  const insets = useSafeAreaInsets();

  // Garde la recette affichée pendant l'animation de retour qui suit une suppression.
  const found = recipes.find((r) => r.id === id);
  const last = useRef<Recipe | undefined>(found);
  if (found) last.current = found;
  const recipe = last.current;

  const [tab, setTab] = useState<Tab>('ingredients');
  const [servings, setServings] = useState(recipe?.servings ?? 2);
  const [timers, setTimers] = useState<Record<number, Timer>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const anyRunning = Object.values(timers).some((t) => t.running);
  useEffect(() => {
    if (!anyRunning) return;
    const tick = setInterval(() => {
      setTimers((current) => {
        const next = { ...current };
        for (const key of Object.keys(next)) {
          const t = next[Number(key)];
          if (!t.running) continue;
          const remaining = t.remaining - 1;
          next[Number(key)] = { remaining: Math.max(0, remaining), running: remaining > 0 };
          if (remaining <= 0) setToast(`Minuteur de l’étape ${Number(key) + 1} terminé`);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [anyRunning]);

  if (!recipe) {
    return (
      <View style={[styles.screen, styles.missing]}>
        <AppText color={color.textOnBrandPrimary}>Cette recette n’existe plus.</AppText>
        <Button label="Retour" onPress={() => router.back()} />
      </View>
    );
  }

  const creator = CREATORS.find((c) => c.id === recipe.creator)!;
  const ingredients = recipe.ingredients.map((i) => formatIngredient(i, servings, recipe.servings));

  const toggleTimer = (index: number, seconds: number) =>
    setTimers((current) => {
      const t = current[index] ?? { remaining: seconds, running: false };
      const remaining = t.remaining > 0 ? t.remaining : seconds;
      return { ...current, [index]: { remaining, running: !t.running } };
    });

  const menuAction = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: tab === 'steps' ? CTA_SPACE + insets.bottom : space[24] }}>
        <Image
          source={recipe.image}
          blurRadius={BLUR_RADIUS}
          style={[styles.blur, { height: BLUR_HEIGHT + insets.top }]}
        />
        <LinearGradient
          colors={['transparent', color.bgBrandPage]}
          style={[styles.blurFade, { top: (BLUR_HEIGHT + insets.top) / 2, height: (BLUR_HEIGHT + insets.top) / 2 }]}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + space[16] }]}>
          <IconButton icon="chevronLeft" accessibilityLabel="Retour" onPress={() => router.back()} />
          <View style={styles.topActions}>
            <IconButton icon="qrCode" accessibilityLabel="Partager" onPress={() => setShareOpen(true)} />
            <IconButton icon="more" accessibilityLabel="Plus d’actions" onPress={() => setMenuOpen(true)} />
          </View>
        </View>

        <View style={styles.hero}>
          <Image source={recipe.image} style={styles.photo} accessibilityIgnoresInvertColors />
          <AppText variant="display" color={color.textOnBrandPrimary} style={styles.title}>
            {recipe.title}
          </AppText>
          <View style={styles.stats}>
            <Stat value={recipe.duration} unit="mn" />
            <View style={styles.statDot} />
            <Stat value={recipe.kcal} unit="kcal" />
          </View>
        </View>

        <View style={styles.creatorBar}>
          <View style={styles.half}>
            <Image source={creator.avatar} style={styles.avatar} />
            <AppText color={color.textOnBrandPrimary} style={styles.underline}>
              {creator.label}
            </AppText>
          </View>
          <View style={styles.divider} />
          <Pressable
            accessibilityRole="button"
            onPress={() => setSaveOpen(true)}
            style={({ pressed }) => [styles.half, pressed && styles.pressed]}>
            <Icon name="bookmark" color={color.textOnBrandPrimary} />
            <AppText color={color.textOnBrandPrimary}>Enregistrer</AppText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <SegmentedTabs options={TABS} value={tab} onChange={setTab} />

          {tab === 'ingredients' ? (
            <PaperCard
              title="Ingrédients"
              headerRight={
                <View style={styles.stepper}>
                  <IconButton
                    icon="minus"
                    variant="primary"
                    size="sm"
                    accessibilityLabel="Une part de moins"
                    onPress={() => setServings(Math.max(1, servings - 1))}
                  />
                  <AppText variant="title" style={styles.fontRegular}>{`${servings}p`}</AppText>
                  <IconButton
                    icon="plus"
                    variant="primary"
                    size="sm"
                    accessibilityLabel="Une part de plus"
                    onPress={() => setServings(Math.min(12, servings + 1))}
                  />
                </View>
              }
              footer={
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShoppingOpen(true)}
                  style={({ pressed }) => [styles.footerAction, pressed && styles.pressed]}>
                  <Icon name="plus" size={16} />
                  <AppText>Ajouter à la liste de course</AppText>
                </Pressable>
              }>
              {ingredients.map((line) => (
                <View key={line} style={styles.ingredient}>
                  <View style={styles.bullet} />
                  <AppText color={color.textSecondary} style={styles.flex}>
                    {line}
                  </AppText>
                </View>
              ))}
              {recipe.tip && <TipCard text={recipe.tip} />}
            </PaperCard>
          ) : (
            <PaperCard title="Étapes">
              <View style={styles.steps}>
                {recipe.steps.map((step, index) => {
                  const timer = timers[index];
                  return (
                    <View key={index} style={styles.step}>
                      <View style={styles.stepNumber}>
                        <AppText variant="step" color={color.actionSecondaryIcon}>
                          {index + 1}
                        </AppText>
                      </View>
                      <AppText color={color.textSecondary}>{step.text}</AppText>
                      {step.timer !== undefined && (
                        <TimerPill
                          remaining={timer?.remaining ?? step.timer}
                          running={timer?.running ?? false}
                          onPress={() => toggleTimer(index, step.timer!)}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </PaperCard>
          )}
        </View>
      </ScrollView>

      {tab === 'steps' && (
        <View pointerEvents="box-none" style={[styles.cta, { bottom: space[16] + insets.bottom }]}>
          <View style={styles.ctaHalo}>
            <Button icon="play" label="Démarrer la recette" onPress={() => setToast('Le mode pas à pas arrive à l’étape 3')} />
          </View>
        </View>
      )}

      {toast && (
        <View style={[styles.toast, { bottom: (tab === 'steps' ? CTA_SPACE : space[16]) + insets.bottom }]}>
          <Toast message={toast} onClose={() => setToast(null)} />
        </View>
      )}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} accessibilityLabel="Fermer le menu" />
        <View style={[styles.menu, { top: insets.top + space[16] + 40 + space[8] }]}>
          <ActionMenu
            items={[
              {
                label: 'Modifier avec l’IA',
                icon: 'edit',
                premium: true,
                onPress: menuAction(() => setToast('La modification par l’IA arrive à l’étape 3')),
              },
              { label: 'Enregistrer', icon: 'bookmark', onPress: menuAction(() => setSaveOpen(true)) },
              { label: 'Partager', icon: 'link', onPress: menuAction(() => setShareOpen(true)) },
              { label: 'Supprimer', icon: 'trash', danger: true, onPress: menuAction(() => setDeleteOpen(true)) },
            ]}
          />
        </View>
      </Modal>

      <ShareDialog
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        onCopyLink={async () => {
          await Clipboard.setStringAsync(`https://toque.app/recette/${recipe.id}`);
          setShareOpen(false);
          setToast('Lien copié');
        }}
      />

      <Dialog
        visible={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Supprimer la recette"
        message={
          <>
            Es-tu sûr de vouloir supprimer la recette{' '}
            <AppText style={styles.strong}>{recipe.title}</AppText> ?
          </>
        }
        confirmLabel="Oui, supprimer"
        onConfirm={() => {
          setDeleteOpen(false);
          removeRecipe(recipe.id);
          router.back();
        }}
      />

      <SaveSheet
        visible={saveOpen}
        onClose={() => setSaveOpen(false)}
        initial={recipe.categories}
        onSave={(labels) => {
          setSaveOpen(false);
          setToast(labels.length ? `Recette enregistrée dans ${labels.join(', ')}` : 'Recette enregistrée');
        }}
      />

      <ShoppingSheet
        visible={shoppingOpen}
        onClose={() => setShoppingOpen(false)}
        items={ingredients}
        onAdd={(selected) => {
          addToShoppingList(selected.map((label) => ({ label, recipeId: recipe.id })));
          setShoppingOpen(false);
          setToast(
            selected.length > 1
              ? `${selected.length} ingrédients ajoutés à ta liste de courses`
              : '1 ingrédient ajouté à ta liste de courses',
          );
        }}
      />
    </View>
  );
}

function Stat({ value, unit }: { value: number; unit: string }) {
  return (
    <AppText variant="stat" color={color.textOnBrandPrimary}>
      {value}
      <AppText color={color.textOnBrandMuted}>{` ${unit}`}</AppText>
    </AppText>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[16],
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  blurFade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
  },
  topActions: {
    flexDirection: 'row',
    gap: space[8],
  },
  hero: {
    alignItems: 'center',
    gap: space[32],
    paddingTop: space[8],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  photo: {
    width: 180,
    height: 180,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: color.borderPhoto,
  },
  title: {
    maxWidth: 257,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.textOnBrandPrimary,
  },
  creatorBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.borderOnBrand,
  },
  half: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: color.borderOnBrand,
  },
  pressed: {
    opacity: 0.6,
  },
  section: {
    gap: space[24],
    paddingHorizontal: space[16],
    paddingTop: space[24],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  strong: {
    fontFamily: font.medium,
  },
  fontRegular: {
    fontFamily: font.regular,
  },
  ingredient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  bullet: {
    width: 6,
    height: 6,
    backgroundColor: color.listBullet,
    transform: [{ rotate: '45deg' }],
  },
  flex: {
    flex: 1,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  steps: {
    gap: space[24],
  },
  step: {
    gap: space[12],
  },
  stepNumber: {
    width: 48,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.actionSecondaryIcon,
    borderRadius: 40,
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ctaHalo: {
    borderRadius: radius.pill,
    ...shadow.fab,
  },
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
  },
  menu: {
    position: 'absolute',
    right: space[16],
  },
});
