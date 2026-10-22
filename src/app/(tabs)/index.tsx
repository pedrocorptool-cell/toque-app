import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { ImportLoading } from '@/components/screens/import/ImportLoading';
import { useSimulatedImport } from '@/components/screens/import/useSimulatedImport';
import { ImportSheet } from '@/components/screens/ImportSheet';
import {
  AppText,
  ChefButton,
  ColorDot,
  Fab,
  FilterChip,
  FilterOptions,
  FilterSheet,
  Logo,
  RecipeCard,
  SearchField,
  TextButton,
  Toast,
  type FilterOption,
} from '@/components/ui';
import {
  type Category,
  CREATORS,
  DURATIONS,
  EMPTY_FILTERS,
  SOURCES,
  creatorOf,
  filterRecipes,
  hashtagsOf,
  matchesText,
  type FilterKey,
  type Filters,
} from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { color, radius, space } from '@/theme/tokens';

const NOTEBOOK = require('@/assets/images/illus/notebook.png');

const FILTERS: { key: FilterKey; chip: string; title: string }[] = [
  { key: 'category', chip: 'Catégorie', title: 'Catégorie' },
  { key: 'creator', chip: 'Créateur', title: 'Créateur' },
  { key: 'duration', chip: 'Durée', title: 'Durée de préparation' },
  { key: 'source', chip: 'Importé via', title: 'Importé via' },
];

/** Figma : écran « Home » — liste des recettes, recherche et filtres. */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, categories } = useRecipes();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  // Dernier filtre ouvert : garde le contenu de la sheet pendant son animation de fermeture.
  const [shownFilter, setShownFilter] = useState<FilterKey>('category');
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [creatorQuery, setCreatorQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useSimulatedImport();
  const [toast, setToast] = useState<string | null>(null);

  const results = useMemo(() => filterRecipes(recipes, query, filters), [recipes, query, filters]);
  const draftCount = useMemo(
    () => filterRecipes(recipes, query, { ...filters, [shownFilter]: draft[shownFilter] }).length,
    [recipes, shownFilter, draft, filters, query],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const openSheet = (key: FilterKey) => {
    setDraft(filters);
    setCreatorQuery('');
    setOpenFilter(key);
    setShownFilter(key);
  };

  const setDraftValues = (key: FilterKey) => (next: string[]) => setDraft({ ...draft, [key]: next });

  const resetAll = () => {
    setQuery('');
    setFilters(EMPTY_FILTERS);
  };

  const current = FILTERS.find((f) => f.key === shownFilter)!;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { paddingTop: insets.top + space[24] }]}>
          <View style={styles.topRow}>
            <Logo />
            <ChefButton onPress={() => setToast('L’offre Toqué Chef arrive bientôt')} />
          </View>
          <AppText variant="title" color={color.textOnBrandPrimary}>
            Vos recettes
          </AppText>
          <SearchField value={query} onChangeText={setQuery} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroller}
            contentContainerStyle={styles.chips}>
            {FILTERS.map(({ key, chip }) => {
              const count = filters[key].length;
              return (
                <FilterChip
                  key={key}
                  label={count ? `${chip} (${count})` : chip}
                  active={count > 0}
                  onPress={() => openSheet(key)}
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {results.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              title={recipe.title}
              image={recipe.image}
              duration={`${recipe.duration}mn`}
              hashtags={hashtagsOf(recipe, categories)}
              creator={creatorOf(recipe)}
              onPress={() => router.push(`/recette/${recipe.id}`)}
            />
          ))}
          {results.length === 0 && (
            <View style={styles.noRecipe}>
              <Image source={NOTEBOOK} style={styles.notebook} />
              {recipes.length === 0 ? (
                <View style={styles.noRecipeTexts}>
                  <AppText variant="headline">Aucune recette</AppText>
                  <AppText color={color.textSecondary} style={styles.noRecipeText}>
                    Tu n’as encore aucune recette enregistrée. Importe ta première recette avec le bouton + !
                  </AppText>
                </View>
              ) : (
                <View style={styles.noRecipeTexts}>
                  <AppText variant="headline">Aucune recette trouvée</AppText>
                  <AppText color={color.textSecondary} style={styles.noRecipeText}>
                    Aucune de tes recettes ne correspond. Essaie un autre mot ou retire un filtre.
                  </AppText>
                  <TextButton label="Tout effacer" onPress={resetAll} />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.fab}>
        <Fab onPress={() => setImportOpen(true)} />
      </View>

      <Toast message={toast} onClose={() => setToast(null)} style={styles.toast} />

      <FilterSheet
        visible={openFilter !== null}
        onClose={() => setOpenFilter(null)}
        title={current.title}
        header={
          shownFilter === 'creator' && (
            <SearchField
              tone="surface"
              value={creatorQuery}
              onChangeText={setCreatorQuery}
              placeholder="Rechercher un créateur"
            />
          )
        }
        count={draftCount}
        onClear={() => setDraftValues(shownFilter)([])}
        onSubmit={() => {
          setFilters(draft);
          setOpenFilter(null);
        }}>
        <FilterOptions
          options={optionsFor(shownFilter, creatorQuery, categories)}
          selected={draft[shownFilter] as string[]}
          onChange={setDraftValues(shownFilter)}
          emptyLabel="Aucun créateur ne correspond."
        />
      </FilterSheet>

      <ImportSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        onStart={(request) => {
          setImportOpen(false);
          setImporting(request);
        }}
      />
      <ImportLoading visible={!!importing} onCancel={() => setImporting(null)} />
    </View>
  );
}

function optionsFor(key: FilterKey, creatorQuery: string, categories: Category[]): FilterOption<string>[] {
  switch (key) {
    case 'category':
      return categories.map((c) => ({ id: c.id, label: c.label, leading: <ColorDot color={c.dot} /> }));
    case 'creator':
      return CREATORS.filter((c) => matchesText(c.label, creatorQuery)).map((c) => ({
        id: c.id,
        label: c.label,
        leading: <Image source={c.avatar} style={styles.creatorAvatar} />,
      }));
    case 'duration':
      return DURATIONS.map((d) => ({ id: d.id, label: d.label }));
    case 'source':
      return SOURCES.map((s) => ({
        id: s.id,
        label: s.label,
        leading: s.logo ? (
          <Image source={s.logo} style={styles.sourceLogo} />
        ) : (
          <Icon name={s.icon!} color={color.actionSecondaryIcon} />
        ),
      }));
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    gap: space[24],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsScroller: {
    marginHorizontal: -space[16],
  },
  chips: {
    gap: space[8],
    paddingHorizontal: space[16],
  },
  content: {
    flex: 1,
    gap: space[16],
    padding: space[16],
    // Laisse de la place au bouton + pour ne pas masquer la dernière carte.
    paddingBottom: space[16] + 56 + space[16],
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
  noRecipe: {
    alignItems: 'center',
    gap: space[24],
    paddingTop: space[40],
  },
  notebook: {
    width: 224,
    height: 204,
  },
  noRecipeTexts: {
    alignItems: 'center',
    gap: space[16],
    maxWidth: 309,
  },
  noRecipeText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    right: space[16],
    bottom: space[16],
  },
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    bottom: space[16] + 56 + space[16],
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sourceLogo: {
    width: 24,
    height: 24,
  },
});
