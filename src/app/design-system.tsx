import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { iconShapes, type IconName } from '@/components/icons/shapes';
import {
  ActionMenu,
  AiChatField,
  AppText,
  BottomSheet,
  Button,
  Checkbox,
  ChefButton,
  ChefTag,
  Creator,
  Dialog,
  Fab,
  FilterChip,
  FilterFooter,
  IconButton,
  Logo,
  RecipeCard,
  SearchField,
  SegmentedTabs,
  Tag,
  TextButton,
  TimerCard,
  TimerPill,
  TimerWidget,
  Toast,
} from '@/components/ui';
import { goBack } from '@/navigation/goBack';
import { color, space, radius, text } from '@/theme/tokens';

/** Catalogue du design system, accessible depuis l'onglet Profil. */
export default function DesignSystemScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>('Toutes');
  const [tab, setTab] = useState<'ingredients' | 'recette'>('ingredients');
  const [checks, setChecks] = useState([true, false]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(true);
  const [sheetItems, setSheetItems] = useState([true, true, true, true, true, true, false]);
  const timer = useCountdown(2 * 3600);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.brandHeader, { paddingTop: insets.top + space[24] }]}>
        <View style={styles.row}>
          <IconButton icon="chevronLeft" accessibilityLabel="Retour" onPress={() => goBack()} />
          <Logo />
          <ChefButton />
        </View>
        <AppText variant="title" color={color.textOnBrandPrimary}>
          Design system
        </AppText>
        <AppText variant="label" color={color.textOnBrandSecondary}>
          Tokens et composants repris du fichier Figma.
        </AppText>
      </View>

      <View style={styles.content}>
        <Section title="Couleurs sémantiques">
          <View style={styles.swatches}>
            {SWATCHES.map(([name, value]) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.swatchColor, { backgroundColor: value }]} />
                <AppText variant="caption">{name}</AppText>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Espacements">
          {([4, 8, 12, 16, 24, 40, 56, 80] as const).map((step) => (
            <View key={step} style={styles.spaceRow}>
              <AppText variant="caption" style={styles.spaceLabel}>
                {step}
              </AppText>
              <View style={[styles.spaceBar, { width: space[step] }]} />
            </View>
          ))}
        </Section>

        <Section title="Typographie · Zalando Sans">
          {(Object.keys(text) as (keyof typeof text)[]).map((variant) => (
            <AppText key={variant} variant={variant}>
              {variant} · {text[variant].fontSize}px
            </AppText>
          ))}
        </Section>

        <Section title="Icônes">
          <View style={styles.icons}>
            {(Object.keys(iconShapes) as IconName[]).map((name) => (
              <View key={name} style={styles.iconCell}>
                <Icon name={name} />
                <AppText variant="caption" color={color.textSecondary} numberOfLines={1}>
                  {name}
                </AppText>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Boutons">
          <Button label="Ajouter" icon="plus" />
          <Button label="Oui, supprimer" />
          <View style={styles.row}>
            <TextButton label="Tout supprimer" icon="trash" />
            <TextButton label="Tout supprimer" icon="trash" tone="danger" />
          </View>
          <View style={styles.rowStart}>
            <IconButton icon="plus" variant="primary" size="sm" accessibilityLabel="Ajouter" />
            <IconButton icon="minus" variant="surface" size="sm" accessibilityLabel="Retirer" />
            <IconButton icon="arrowLeft" variant="primary" size="lg" accessibilityLabel="Précédent" />
            <IconButton icon="arrowLeft" variant="surface" size="lg" accessibilityLabel="Précédent" />
            <IconButton icon="more" variant="plain" accessibilityLabel="Plus d’actions" />
            <Fab />
          </View>
          <View style={[styles.rowStart, styles.onBrand]}>
            <IconButton icon="chevronLeft" accessibilityLabel="Retour" />
            <IconButton icon="qrCode" accessibilityLabel="QR code" />
            <IconButton icon="more" accessibilityLabel="Plus d’actions" />
            <IconButton icon="close" accessibilityLabel="Fermer" />
          </View>
        </Section>

        <Section title="Champs et filtres" brand>
          <SearchField value={search} onChangeText={setSearch} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {['Toutes', 'Catégorie', 'Créateur', 'Durée', 'Importé via'].map((label) => (
              <FilterChip
                key={label}
                label={label}
                active={activeChip === label}
                onPress={() => setActiveChip(activeChip === label ? null : label)}
              />
            ))}
          </ScrollView>
          <SegmentedTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'ingredients', label: 'Ingrédients', icon: 'ingredients' },
              { value: 'recette', label: 'Recette', icon: 'recipe' },
            ]}
          />
        </Section>

        <Section title="Champ IA">
          <AiChatField
            value={prompt}
            onChangeText={setPrompt}
            generating={generating}
            onSubmit={() => setGenerating(true)}
            onStop={() => setGenerating(false)}
          />
          <TextButton label={generating ? 'Simuler la fin' : 'Simuler une génération'} onPress={() => setGenerating(!generating)} />
        </Section>

        <Section title="Carte recette">
          <View style={styles.rowStart}>
            <Tag label="20mn" />
            <Tag label="#CheatMeal #Végé" />
            <ChefTag />
          </View>
          <Creator name="Whoogy’s" avatar={require('@/assets/images/demo/av_whoogys.png')} />
          <RecipeCard
            title="Pasta alla zozzona"
            image={require('@/assets/images/demo/pasta.jpg')}
            duration="20mn"
            hashtags="#CheatMeal #Végé"
            creator={{ name: 'Whoogy’s', avatar: require('@/assets/images/demo/av_whoogys.png') }}
          />
          <RecipeCard
            title="Naan tomate mozza poivrons"
            image={require('@/assets/images/demo/naan.jpg')}
            duration="45mn"
            creator={{ name: 'Marmiton', avatar: require('@/assets/images/demo/av_marmiton.png') }}
          />
        </Section>

        <Section title="Checkbox">
          {checks.map((checked, i) => (
            <Checkbox
              key={i}
              label={`Aliment n°${i + 1}`}
              checked={checked}
              onChange={(next) => setChecks(checks.map((c, j) => (j === i ? next : c)))}
            />
          ))}
        </Section>

        <Section title="Minuteur">
          <TimerCard remaining={timer.remaining} running={timer.running} onToggle={timer.toggle} onCancel={timer.reset} />
          <TimerWidget count={2} remaining={timer.remaining} />
          <TimerPill remaining={timer.remaining} onPress={timer.toggle} />
        </Section>

        <Section title="Menu, toast et fenêtres">
          <ActionMenu
            items={[
              { label: 'Modifier avec l’IA', icon: 'edit', premium: true },
              { label: 'Enregistrer', icon: 'bookmark' },
              { label: 'Partager', icon: 'link' },
              { label: 'Supprimer', icon: 'trash', danger: true, onPress: () => setDialogOpen(true) },
            ]}
          />
          {toastVisible ? (
            <Toast message="Recette adaptée avec succès" onClose={() => setToastVisible(false)} />
          ) : (
            <TextButton label="Réafficher le toast" onPress={() => setToastVisible(true)} />
          )}
          <View style={styles.row}>
            <Button label="Bottom sheet" onPress={() => setSheetOpen(true)} />
            <Button label="Dialogue" onPress={() => setDialogOpen(true)} />
          </View>
          <FilterFooter count={4} onClear={() => undefined} onSubmit={() => undefined} />
        </Section>
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Ajouter à la liste de courses"
        footer={<Button block icon="plus" label="Ajouter" onPress={() => setSheetOpen(false)} />}>
        <View style={styles.sheetList}>
          <AppText variant="overline" color={color.textSecondary}>
            {`${sheetItems.length} ingrédients`}
          </AppText>
          <View style={styles.sheetCard}>
            {sheetItems.map((checked, i) => (
              <Checkbox
                key={i}
                label={`Aliment n°${i + 1}`}
                checked={checked}
                onChange={(next) => setSheetItems(sheetItems.map((c, j) => (j === i ? next : c)))}
              />
            ))}
          </View>
        </View>
      </BottomSheet>

      <Dialog
        visible={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Supprimer la recette"
        message={
          <>
            Es-tu sûr de vouloir supprimer la recette{' '}
            <AppText style={{ fontFamily: text.title.fontFamily }}>Pasta alla zozzona</AppText> ?
          </>
        }
        confirmLabel="Oui, supprimer"
        onConfirm={() => setDialogOpen(false)}
      />
    </ScrollView>
  );
}

function Section({ title, brand, children }: { title: string; brand?: boolean; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" color={color.textSecondary}>
        {title}
      </AppText>
      <View style={[styles.sectionBody, brand && styles.onBrand]}>{children}</View>
    </View>
  );
}

function useCountdown(initial: number) {
  const [remaining, setRemaining] = useState(initial);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  return {
    remaining,
    running,
    toggle: () => setRunning((r) => !r),
    reset: () => {
      setRunning(false);
      setRemaining(initial);
    },
  };
}

const SWATCHES = Object.entries(color).filter(([, value]) => typeof value === 'string');

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  brandHeader: {
    gap: space[24],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    gap: space[32],
    padding: space[16],
    paddingBottom: space[40],
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
  section: {
    gap: space[12],
  },
  sectionBody: {
    gap: space[16],
  },
  onBrand: {
    padding: space[16],
    borderRadius: radius.xl,
    backgroundColor: color.bgBrandPage,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  rowStart: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space[12],
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[12],
  },
  swatch: {
    width: 104,
    gap: space[4],
  },
  swatchColor: {
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.borderDefault,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
  },
  spaceLabel: {
    width: 24,
  },
  spaceBar: {
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: color.actionPrimaryBg,
  },
  icons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[8],
  },
  iconCell: {
    width: 76,
    alignItems: 'center',
    gap: space[4],
    paddingVertical: space[8],
    borderRadius: radius.md,
    backgroundColor: color.bgSurface,
  },
  chips: {
    gap: space[8],
  },
  sheetList: {
    gap: space[16],
  },
  sheetCard: {
    gap: space[16],
    padding: space[16],
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
});
