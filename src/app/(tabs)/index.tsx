import { router, useLocalSearchParams } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { ImportError } from '@/components/screens/import/ImportError';
import { ImportLoading } from '@/components/screens/import/ImportLoading';
import { useImport } from '@/components/screens/import/useImport';
import { ImportSheet } from '@/components/screens/ImportSheet';
import { CookingCards } from '@/components/screens/CookingCards';
import {
  AppText,
  Tappable,
  FilterChip,
  FilterOptions,
  FilterSheet,
  Logo,
  RecipeCard,
  SearchField,
  TextButton,
  Toast,
  useToast,
  type FilterOption,
} from '@/components/ui';
import { LIST_TOAST_END, RecipeActions, type RecipeSheet } from '@/components/screens/recipe/RecipeActions';
import {
  type Category,
  DURATIONS,
  EMPTY_FILTERS,
  SOURCES,
  creatorOf,
  creatorsOf,
  filterRecipes,
  hashtagsOf,
  toHashtag,
  matchesText,
  type FilterKey,
  type Recipe,
  type Filters,
} from '@/data/recipes';
import { haptics } from '@/data/haptics';
import { socialOf } from '@/data/imports';
import { useRecipes } from '@/data/RecipesContext';
import { color, radius, space } from '@/theme/tokens';

const NOTEBOOK = require('@/assets/images/illus/notebook.png');

const FILTERS: { key: FilterKey; chip: string; title: string }[] = [
  { key: 'category', chip: 'Catégorie', title: 'Catégorie' },
  { key: 'creator', chip: 'Créateur', title: 'Créateur' },
  { key: 'duration', chip: 'Durée', title: 'Durée de préparation' },
  { key: 'source', chip: 'Importé via', title: 'Importé via' },
];

const NATIVE = Platform.OS !== 'web';
// Défilement minimal (px) dans un sens avant de cacher ou de rouvrir la recherche et les filtres.
const SCROLL_NUDGE = 6;

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
  // Appui long sur une carte : la sheet des actions de cette recette, puis celle qu'on y choisit.
  const [actions, setActions] = useState<{ recipe: Recipe; sheet: RecipeSheet | null } | null>(null);
  const toast = useToast();
  // Le + de la barre d'onglets passe un paramètre nouveau à chaque appui : la sheet d'import s'ouvre.
  const { importer } = useLocalSearchParams<{ importer?: string }>();
  useEffect(() => {
    if (importer) setImportOpen(true);
  }, [importer]);
  const [importing, setImporting, importFailed, setImportFailed, failure] = useImport();

  // « Partager vers Toqué » depuis Instagram, TikTok, un navigateur… : le lien partagé lance l'import.
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  useEffect(() => {
    if (!hasShareIntent) return;
    const url = shareIntent.webUrl ?? shareIntent.text?.match(/https?:\/\/\S+/)?.[0];
    resetShareIntent();
    if (!url) return;
    const network = socialOf(url);
    setImporting(network ? { method: 'social', network, url } : { method: 'web', url });
  }, [hasShareIntent, shareIntent, resetShareIntent, setImporting]);

  const results = useMemo(() => filterRecipes(recipes, query, filters), [recipes, query, filters]);
  const draftCount = useMemo(
    () => filterRecipes(recipes, query, { ...filters, [shownFilter]: draft[shownFilter] }).length,
    [recipes, shownFilter, draft, filters, query],
  );

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

  // En descendant dans la liste, la recherche et les filtres remontent sous le logo et « Vos recettes » : la liste
  // prend tout l'écran. Ils reviennent dès qu'on remonte, et restent toujours visibles en haut de la liste.
  const [topHeight, setTopHeight] = useState(0);
  const [toolsHeight, setToolsHeight] = useState(0);
  const hide = useRef(new Animated.Value(0)).current;
  const hidden = useRef(false);
  const lastY = useRef(0);
  const setHidden = (next: boolean) => {
    if (hidden.current === next) return;
    hidden.current = next;
    Animated.timing(hide, {
      toValue: next ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
  };
  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    if (y <= toolsHeight) setHidden(false);
    else if (dy > SCROLL_NUDGE) setHidden(true);
    else if (dy < -SCROLL_NUDGE) setHidden(false);
    else return;
    lastY.current = y;
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topHeight + toolsHeight }]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}>
        <View style={styles.content}>
          <CookingCards />
          {results.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              title={recipe.title}
              image={recipe.image}
              duration={`${recipe.duration} mn`}
              hashtags={hashtagsOf(recipe, categories)}
              creator={creatorOf(recipe)}
              onPress={() => router.push(`/recette/${recipe.id}`)}
              onLongPress={() => {
                haptics.lift();
                setActions({ recipe, sheet: 'menu' });
              }}
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
                    Nous n’avons trouvé aucune recette. Modifie les filtres ou essaye un autre mot clé.
                  </AppText>
                  <TextButton label="Réinitialiser les filtres" onPress={resetAll} />
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Recherche et filtres : sous le haut de l'en-tête, ils glissent dessous quand on descend dans la liste. */}
      <Animated.View
        onLayout={(e) => setToolsHeight(e.nativeEvent.layout.height)}
        style={[
          styles.tools,
          {
            top: topHeight,
            opacity: hide.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0, 0] }),
            transform: [{ translateY: hide.interpolate({ inputRange: [0, 1], outputRange: [0, -toolsHeight] }) }],
          },
        ]}>
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
      </Animated.View>
      <View
        onLayout={(e) => setTopHeight(e.nativeEvent.layout.height)}
        style={[styles.header, { paddingTop: insets.top + space[24] }]}>
        <View style={styles.topRow}>
          <Logo />
          <Tappable
            accessibilityRole="button"
            accessibilityLabel="Profil"
            onPress={() => router.navigate('/profil')}
            hitSlop={space[4]}
            style={styles.profile}>
            <Icon name="profile" color={color.textPrimary} />
          </Tappable>
        </View>
        <AppText variant="title" color={color.textOnBrandPrimary}>
          Vos recettes
        </AppText>
      </View>

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
          options={optionsFor(shownFilter, creatorQuery, categories, recipes)}
          selected={draft[shownFilter] as string[]}
          onChange={setDraftValues(shownFilter)}
          emptyLabel="Aucun créateur ne correspond."
        />
      </FilterSheet>

      {actions && (
        <RecipeActions
          recipe={actions.recipe}
          sheet={actions.sheet}
          onSheet={(sheet) => setActions((a) => a && { ...a, sheet })}
          onToast={toast.show}
        />
      )}
      <Toast
        message={toast.message}
        onClose={toast.hide}
        action={
          toast.message?.endsWith(LIST_TOAST_END)
            ? { label: 'Voir', onPress: () => (toast.hide(), router.navigate('/liste')) }
            : undefined
        }
        style={styles.toast}
      />

      <ImportSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        onStart={(request) => {
          setImportOpen(false);
          setImporting(request);
        }}
      />
      <ImportLoading visible={!!importing} onCancel={() => setImporting(null)} />
      <ImportError
        visible={!!importFailed}
        reason={failure}
        onRetry={() => {
          setImportFailed(null);
          setImporting(importFailed);
        }}
        onClose={() => setImportFailed(null)}
      />
    </View>
  );
}

function optionsFor(
  key: FilterKey,
  creatorQuery: string,
  categories: Category[],
  recipes: Recipe[],
): FilterOption<string>[] {
  switch (key) {
    case 'category':
      return categories.map((c) => ({ id: c.id, label: c.hashtag ?? toHashtag(c.label) }));
    case 'creator':
      // Les créateurs des recettes enregistrées ; le nom seul quand l'import n'a pas trouvé d'avatar.
      return creatorsOf(recipes)
        .filter((c) => matchesText(c.name, creatorQuery))
        .map((c) => ({
          id: c.id,
          label: c.name,
          leading: c.avatar && <Image source={c.avatar} style={styles.creatorAvatar} />,
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
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    bottom: space[16],
  },
  scrollContent: {
    flexGrow: 1,
  },
  // En-tête fixe : logo, profil et « Vos recettes » restent toujours à l'écran.
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: space[24],
    paddingHorizontal: space[16],
    paddingBottom: space[16],
    backgroundColor: color.bgBrandPage,
  },
  // Recherche et filtres, sous l'en-tête fixe (24 px sous le titre comme avant, 24 px au-dessus de la liste).
  tools: {
    position: 'absolute',
    left: 0,
    right: 0,
    gap: space[24],
    paddingHorizontal: space[16],
    paddingTop: space[8],
    paddingBottom: space[24],
    backgroundColor: color.bgBrandPage,
  },
  // Même hauteur que la ligne de la home (icône du profil de 40 px) : le logo ne bouge pas d'un onglet à l'autre.
  topRow: {
    minHeight: 40,
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
    paddingBottom: space[24],
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
  // Figma « Home » : rond bleu de 40 px en haut à droite, icône du profil au centre.
  profile: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.accentBlue,
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
