import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurGlow } from '@/components/art/BlurGlow';
import { Icon } from '@/components/icons/Icon';
import { PaperCard } from '@/components/screens/recipe/PaperCard';
import { SaveSheet } from '@/components/screens/recipe/SaveSheet';
import { ShareDialog } from '@/components/screens/recipe/ShareDialog';
import { ShoppingSheet } from '@/components/screens/recipe/ShoppingSheet';
import { PICKER, picked } from '@/components/screens/import/PhotoImport';
import { TipCard } from '@/components/screens/recipe/TipCard';
import { TimerSheet } from '@/components/screens/TimerSheet';
import {
  AppText,
  BottomSheet,
  Button,
  Dialog,
  IconButton,
  ListCard,
  ListRow,
  SegmentedTabs,
  Tag,
  TimerPill,
  Toast,
  Tappable,
} from '@/components/ui';
import { SHEET_DURATION } from '@/components/ui/Overlays';
import { importRecipe } from '@/data/imports';
import { useProfile } from '@/data/ProfileContext';
import { creatorOf, formatIngredient, savedHashtagsOf, type Recipe } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { haptics } from '@/data/haptics';
import { useShopping } from '@/data/ShoppingContext';
import { isDone, orderTimers, useTimers } from '@/data/TimersContext';
import { goBack } from '@/navigation/goBack';
import { blur, color, font, radius, shadow, space } from '@/theme/tokens';

const MISSING = require('@/assets/images/illus/missing-recipe.png');

type Tab = 'ingredients' | 'steps';

const TABS = [
  { value: 'ingredients', label: 'Ingrédients', icon: 'ingredients' },
  { value: 'steps', label: 'Recette', icon: 'recipe' },
] as const;

/** Fin du toast d'ajout à la liste de courses, qui porte l'action « Voir ». */
const LIST_TOAST_END = 'à la liste';
const ESTIMATED =
  'Les quantités n’étaient pas écrites dans la publication : Toqué les a estimées. Si la recette est en ' +
  'commentaire, fais-en une capture pour la corriger.';
/** Hauteur de la photo floutée derrière le hero (Figma : 244 px sous la barre d'état). */
const BLUR_HEIGHT = 244;
/** Bouton flottant « Démarrer la recette » : 48 px de haut, à 32 px du bas de l'écran. */
const CTA_BOTTOM = space[32];
/** Hauteur réservée sous la dernière étape : en fin de défilement, la carte blanche s'arrête juste sous le
 * bouton (16 px de blanc) et laisse 16 px de fond brun en bas de l'écran. */
const CTA_SLOT = 48 + space[16];
/** Hauteur occupée par le bouton, pour poser toast et rappel au-dessus. */
const CTA_SPACE = CTA_BOTTOM + 48 + space[16];

/** Figma : pages « Recette » onglets Ingrédients (191:4705) et Étapes (191:4824). */
export default function RecipeScreen() {
  // « etape » : index de l'étape à montrer, quand on revient sur la fiche depuis la carte d'un minuteur.
  const { id, importee, etape } = useLocalSearchParams<{ id: string; importee?: string; etape?: string }>();
  const { recipes, removeRecipe, categories, setRecipeCategories, updateRecipe } = useRecipes();
  const { addFromRecipe } = useShopping();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Garde la recette affichée pendant l'animation de retour qui suit une suppression.
  const found = recipes.find((r) => r.id === id);
  const last = useRef<Recipe | undefined>(found);
  if (found) last.current = found;
  const recipe = last.current;

  const [tab, setTab] = useState<Tab>(etape ? 'steps' : 'ingredients');
  // La fiche s'ouvre sur les parts par défaut du profil ; les quantités sont recalculées depuis la recette.
  const { defaultServings } = useProfile();
  const [servings, setServings] = useState(defaultServings);
  const { timers: allTimers, timerFor, toggle, beforeTimerStart, remove, setFocusedRecipeId } = useTimers();
  const [timersOpen, setTimersOpen] = useState(false);

  // Écran au premier plan : la sheet ne doit pas s'ouvrir par-dessus le mode étape par étape.
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocusedRecipeId(id ?? null);
      setFocused(true);
      return () => {
        setFocusedRecipeId(null);
        setFocused(false);
      };
    }, [id, setFocusedRecipeId]),
  );

  // Un minuteur arrive à zéro, de cette recette ou d'une autre : la sheet de la fiche s'ouvre (celle des onglets
  // est réservée aux autres écrans).
  const doneCount = allTimers.filter(isDone).length;
  const previousDone = useRef(doneCount);
  useEffect(() => {
    if (doneCount > previousDone.current && focused) setTimersOpen(true);
    previousDone.current = doneCount;
  }, [doneCount, focused]);

  // Plus aucun minuteur : la sheet se referme (et ne se rouvrira pas toute seule au prochain lancement).
  const timerCount = allTimers.length;
  useEffect(() => {
    if (timerCount === 0) setTimersOpen(false);
  }, [timerCount]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(importee ? 'Recette importée dans tes recettes' : null);
  const photoRef = useRef<Image>(null);
  // Retour depuis un minuteur : la fiche s'ouvre sur l'onglet Recette, défilée jusqu'à l'étape du minuteur.
  const scrollRef = useRef<ScrollView>(null);
  const stepRefs = useRef<(View | null)[]>([]);
  useEffect(() => {
    if (!etape) return;
    const t = setTimeout(() => {
      stepRefs.current[Number(etape)]?.measureInWindow((_x, y) => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - insets.top - space[32]), animated: true });
      });
    }, 400);
    return () => clearTimeout(t);
    // Une seule fois, à l'ouverture de la fiche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const blurRef = useRef<View>(null);

  // Recette estimée : une capture du commentaire qui donne la recette remplace ingrédients et étapes, en gardant
  // le titre, l'image et le créateur du post.
  const [correcting, setCorrecting] = useState(false);
  const correct = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER);
    if (result.canceled || !recipe) return;
    setCorrecting(true);
    try {
      const read = await importRecipe({ method: 'photo', ...picked(result.assets[0]) }, categories);
      updateRecipe(recipe.id, {
        servings: read.servings,
        duration: read.duration,
        kcal: read.kcal,
        ingredients: read.ingredients,
        steps: read.steps,
        tip: read.tip ?? recipe.tip,
        estimated: undefined,
      });
      setToast('Recette corrigée avec ta capture');
    } catch {
      setToast('Toqué n’a pas trouvé la recette sur cette capture');
    } finally {
      setCorrecting(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!recipe) {
    return (
      <View style={[styles.screen, styles.missing]}>
        <Image source={MISSING} style={styles.missingIllus} accessibilityIgnoresInvertColors />
        <AppText color={color.textOnBrandPrimary} style={styles.missingTitle} accessibilityRole="header">
          Cette recette n’existe plus.
        </AppText>
        <Button variant="secondary" label="Retour" onPress={() => goBack()} />
      </View>
    );
  }

  const creator = creatorOf(recipe);
  const saved = savedHashtagsOf(recipe, categories);
  const ingredients = recipe.ingredients.map((i) => formatIngredient(i, servings, recipe.servings));

  // Les minuteurs suivent d'une recette à l'autre : ceux de cette fiche en premier, puis ceux des autres recettes.
  const timers = orderTimers(allTimers, recipe.id);

  /** Premier appui : lance le minuteur. Ensuite : ouvre la sheet pour le piloter. */
  const pressTimer = async (index: number, seconds: number) => {
    if (timerFor(recipe.id, index)) return setTimersOpen(true);
    await beforeTimerStart();
    toggle(recipe.id, index, seconds);
  };

  /** Mesure la photo et le flou à l'écran : le mode étape par étape part de là pour sa transition. */
  const startStepByStep = () => {
    photoRef.current?.measureInWindow((px, py, ps) => {
      blurRef.current?.measureInWindow((_bx, by, _bw, bh) => {
        const params = {
          id: recipe.id,
          px: String(px),
          py: String(py),
          ps: String(ps),
          by: String(by),
          bh: String(bh),
        };
        router.push({ pathname: '/pas-a-pas/[id]', params });
      });
    });
  };

  // La sheet des actions descend d'abord : la suivante (enregistrer, partager…) ne s'ouvre qu'après.
  const menuAction = (action: () => void) => () => {
    setMenuOpen(false);
    setTimeout(action, SHEET_DURATION);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: tab === 'steps' ? space[16] + insets.bottom : space[24] }}>
        <View ref={blurRef} style={[styles.blur, { height: BLUR_HEIGHT + insets.top }]}>
          <BlurGlow source={recipe.image} width={screenWidth} height={BLUR_HEIGHT + insets.top} blur={blur.hero} />
        </View>

        <View style={[styles.topBar, { paddingTop: insets.top + space[16] }]}>
          <IconButton icon="chevronLeft" accessibilityLabel="Retour" onPress={() => goBack()} />
          <View style={styles.topActions}>
            <IconButton icon="qrCode" accessibilityLabel="Partager" onPress={() => setShareOpen(true)} />
            <IconButton icon="more" accessibilityLabel="Plus d’actions" onPress={() => setMenuOpen(true)} />
          </View>
        </View>

        <View style={styles.hero}>
          {/* Masquée pendant le mode étape par étape : c'est sa copie animée qui voyage là-bas et revient. */}
          <Image
            ref={photoRef}
            source={recipe.image}
            style={[styles.photo, !focused && styles.away]}
            accessibilityIgnoresInvertColors
          />
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
          {/* Recette importée par lien : le créateur ouvre la page d'origine. */}
          <Tappable
            style={styles.half}
            disabled={!recipe.url}
            accessibilityRole={recipe.url ? 'link' : undefined}
            onPress={() => recipe.url && Linking.openURL(recipe.url)}>
            {creator.avatar && <Image source={creator.avatar} style={styles.avatar} />}
            <AppText color={color.textOnBrandPrimary} style={styles.underline} numberOfLines={1}>
              {creator.name}
            </AppText>
          </Tappable>
          <View style={styles.divider} />
          {/* Recette déjà classée : ses catégories remplacent « Enregistrer » et ouvrent la même sheet. */}
          <Tappable
            accessibilityRole="button"
            accessibilityLabel={saved ? `Modifier les catégories : ${saved}` : undefined}
            onPress={() => setSaveOpen(true)}
            style={styles.half}>
            {saved ? (
              <Tag label={saved} tone="onBrand" shrink />
            ) : (
              <>
                <View style={styles.fixed}>
                  <Icon name="bookmark" color={color.textOnBrandPrimary} />
                </View>
                <AppText color={color.textOnBrandPrimary}>Enregistrer</AppText>
              </>
            )}
          </Tappable>
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
                <Tappable accessibilityRole="button" onPress={() => setShoppingOpen(true)} style={styles.footerAction}>
                  <Icon name="basket" color={color.actionSecondaryIcon} />
                  <AppText>Ajouter à la liste de courses</AppText>
                </Tappable>
              }>
              {ingredients.map((line) => (
                <View key={line} style={styles.ingredient}>
                  <View style={styles.bullet} />
                  <AppText color={color.textSecondary} style={styles.flex}>
                    {line}
                  </AppText>
                </View>
              ))}
              {recipe.estimated && (
                // En attendant la maquette dédiée : même bloc que l'astuce.
                <TipCard
                  icon="magic"
                  title="Quantités estimées"
                  text={ESTIMATED}
                  action={{
                    label: correcting ? 'Lecture de la capture…' : 'Corriger avec une capture',
                    icon: 'images',
                    onPress: () => !correcting && correct(),
                  }}
                />
              )}
              {recipe.tip && <TipCard text={recipe.tip} />}
            </PaperCard>
          ) : (
            <PaperCard title="Étapes">
              <View style={styles.steps}>
                {recipe.steps.map((step, index) => {
                  const timer = timerFor(recipe.id, index);
                  return (
                    <View
                      key={index}
                      ref={(el) => {
                        stepRefs.current[index] = el;
                      }}
                      style={styles.step}>
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
                          onPress={() => pressTimer(index, step.timer!)}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
              {/* Réserve la place du bouton flottant : il reste sur fond blanc jusqu'en fin de défilement. */}
              <View style={{ height: CTA_SLOT }} />
            </PaperCard>
          )}
        </View>
      </ScrollView>

      {tab === 'steps' && (
        <View pointerEvents="box-none" style={[styles.cta, { bottom: CTA_BOTTOM + insets.bottom }]}>
          <View style={styles.ctaHalo}>
            <Button icon="play" label="Démarrer la recette" onPress={startStepByStep} />
          </View>
        </View>
      )}

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        action={
          toast?.endsWith(LIST_TOAST_END)
            ? {
                label: 'Voir',
                onPress: () => {
                  setToast(null);
                  router.navigate('/liste');
                },
              }
            : undefined
        }
        style={[styles.toast, { bottom: (tab === 'steps' ? CTA_SPACE : space[16]) + insets.bottom }]}
      />

      {/* Figma 706:540 « Actions recette » : les actions du « … » dans une sheet, en bas de l'écran. */}
      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
        <ListCard>
          <ListRow
            label="Enregistrer"
            leading={<Icon name="bookmark" />}
            onPress={menuAction(() => setSaveOpen(true))}
          />
          <ListRow
            label="Ajouter à la liste de courses"
            leading={<Icon name="basket" />}
            onPress={menuAction(() => setShoppingOpen(true))}
          />
          <ListRow label="Partager" leading={<Icon name="qrCode" />} onPress={menuAction(() => setShareOpen(true))} />
          <ListRow
            label="Supprimer"
            danger
            leading={<Icon name="trash" color={color.feedbackDanger} />}
            onPress={menuAction(() => setDeleteOpen(true))}
          />
        </ListCard>
      </BottomSheet>

      <TimerSheet visible={timersOpen} onClose={() => setTimersOpen(false)} timers={timers} />

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
            Es-tu sûr de vouloir supprimer la recette <AppText style={styles.strong}>{recipe.title}</AppText> ?
          </>
        }
        confirmLabel="Oui, supprimer"
        onConfirm={() => {
          setDeleteOpen(false);
          removeRecipe(recipe.id);
          goBack();
        }}
      />

      <SaveSheet
        visible={saveOpen}
        onClose={() => setSaveOpen(false)}
        initial={recipe.categories}
        onSave={(ids) => {
          setSaveOpen(false);
          setRecipeCategories(recipe.id, ids);
          if (ids.length) haptics.success();
          const labels = categories.filter((c) => ids.includes(c.id)).map((c) => c.label);
          setToast(
            labels.length ? `Recette enregistrée dans ${labels.join(', ')}` : 'Recette retirée de tes catégories',
          );
        }}
      />

      <ShoppingSheet
        visible={shoppingOpen}
        onClose={() => setShoppingOpen(false)}
        items={ingredients}
        onAdd={(selected) => {
          addFromRecipe(selected, recipe.id);
          setShoppingOpen(false);
          setToast(
            selected.length > 1
              ? `${selected.length} ingrédients ajoutés ${LIST_TOAST_END}`
              : `1 ingrédient ajouté ${LIST_TOAST_END}`,
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
  // Figma « Recette/ Introuvable » 714:3046.
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[40],
    paddingHorizontal: space[16],
  },
  // Image exportée avec ses ombres (413 × 357) : marges négatives pour garder la boîte Figma de 361 × 322.
  missingIllus: {
    width: 413,
    height: 357,
    marginVertical: -18,
  },
  missingTitle: {
    fontFamily: font.medium,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  blur: {
    position: 'absolute',
    top: 0,
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
  away: {
    opacity: 0,
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
    // Figma 713:2325 : 16 px entre chaque moitié et la barre.
    gap: space[16],
    paddingHorizontal: space[16],
    paddingVertical: space[12],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.borderOnBrand,
  },
  fixed: {
    flexShrink: 0,
  },
  half: {
    flex: 1,
    minWidth: 0,
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
});
