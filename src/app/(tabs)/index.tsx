import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { ImportSheet, type ImportMethod } from '@/components/screens/ImportSheet';
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
  CATEGORIES,
  CREATORS,
  DURATIONS,
  EMPTY_FILTERS,
  RECIPES,
  SOURCES,
  creatorOf,
  filterRecipes,
  hashtagsOf,
  matchesText,
  type FilterKey,
  type Filters,
} from '@/data/recipes';
import { color, radius, space } from '@/theme/tokens';

const FILTERS: { key: FilterKey; chip: string; title: string }[] = [
  { key: 'category', chip: 'Catégorie', title: 'Catégorie' },
  { key: 'creator', chip: 'Créateur', title: 'Créateur' },
  { key: 'duration', chip: 'Durée', title: 'Durée de préparation' },
  { key: 'source', chip: 'Importé via', title: 'Importé via' },
];

const IMPORT_LABEL: Record<ImportMethod, string> = {
  social: 'L’import depuis les réseaux sociaux',
  photo: 'L’import par photo',
  web: 'L’import par lien web',
};

/** Figma : écran « Home » — liste des recettes, recherche et filtres. */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [creatorQuery, setCreatorQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const results = useMemo(() => filterRecipes(RECIPES, query, filters), [query, filters]);
  const draftCount = useMemo(
    () => (openFilter ? filterRecipes(RECIPES, query, { ...filters, [openFilter]: draft[openFilter] }).length : 0),
    [openFilter, draft, filters, query],
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
  };

  const setDraftValues = (key: FilterKey) => (next: string[]) => setDraft({ ...draft, [key]: next });

  const resetAll = () => {
    setQuery('');
    setFilters(EMPTY_FILTERS);
  };

  const current = FILTERS.find((f) => f.key === openFilter);

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
              hashtags={hashtagsOf(recipe)}
              creator={creatorOf(recipe)}
              onPress={() => setToast('La fiche recette arrive à l’étape suivante')}
            />
          ))}
          {results.length === 0 && (
            <View style={styles.empty}>
              <Icon name="search" color={color.textSecondary} />
              <AppText variant="cardTitle">Aucune recette trouvée</AppText>
              <AppText color={color.textSecondary} style={styles.emptyText}>
                Essaie un autre mot ou retire un filtre.
              </AppText>
              <TextButton label="Tout effacer" onPress={resetAll} />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.fab}>
        <Fab onPress={() => setImportOpen(true)} />
      </View>

      {toast && (
        <View style={styles.toast}>
          <Toast message={toast} onClose={() => setToast(null)} />
        </View>
      )}

      <FilterSheet
        visible={current !== undefined}
        onClose={() => setOpenFilter(null)}
        title={current?.title ?? ''}
        header={
          openFilter === 'creator' && (
            <SearchField
              tone="surface"
              value={creatorQuery}
              onChangeText={setCreatorQuery}
              placeholder="Rechercher un créateur"
            />
          )
        }
        count={draftCount}
        onClear={() => openFilter && setDraftValues(openFilter)([])}
        onSubmit={() => {
          setFilters(draft);
          setOpenFilter(null);
        }}>
        {openFilter && (
          <FilterOptions
            options={optionsFor(openFilter, creatorQuery)}
            selected={draft[openFilter] as string[]}
            onChange={setDraftValues(openFilter)}
            emptyLabel="Aucun créateur ne correspond."
          />
        )}
      </FilterSheet>

      <ImportSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        onPick={(method) => {
          setImportOpen(false);
          setToast(`${IMPORT_LABEL[method]} arrive à l’étape suivante`);
        }}
      />
    </View>
  );
}

function optionsFor(key: FilterKey, creatorQuery: string): FilterOption<string>[] {
  switch (key) {
    case 'category':
      return CATEGORIES.map((c) => ({ id: c.id, label: c.label, leading: <ColorDot color={c.dot} /> }));
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
  empty: {
    alignItems: 'center',
    gap: space[8],
    paddingVertical: space[48],
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: space[8],
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
