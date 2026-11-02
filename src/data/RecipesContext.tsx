import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { isStoredImage, storeRecipeImage } from './imports';

import { type Category, type CategoryId, type Recipe } from './recipes';
import { encodeRecipe } from './space';
import { useRowSync, useSpace } from './SpaceContext';

type RecipesState = {
  recipes: Recipe[];
  /** Recette importée : ajoutée en tête de liste. */
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  /** Catégories de départ et celles créées par l'utilisateur. */
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  /** Retire la catégorie et la décoche des recettes, qui restent enregistrées. */
  removeCategory: (id: CategoryId) => void;
  setRecipeCategories: (id: string, categories: CategoryId[]) => void;
  /** Remplace la vignette par la photo du plat prise en fin de recette. */
  setRecipeImage: (id: string, uri: string) => void;
  /** Remplace une partie de la recette (quantités corrigées depuis une capture). */
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
};

const RecipesContext = createContext<RecipesState | null>(null);

/** Recettes et catégories de l'espace, enregistrées dans la base à chaque modification. */
export function RecipesProvider({ children }: { children: ReactNode }) {
  const { snapshot } = useSpace();
  const [recipes, setRecipes] = useState(snapshot.recipes);
  const [categories, setCategories] = useState(snapshot.categories);

  useEffect(() => {
    setRecipes(snapshot.recipes);
    setCategories(snapshot.categories);
  }, [snapshot]);
  useRowSync('recipes', recipes, snapshot.recipes, encodeRecipe);
  useRowSync('categories', categories, snapshot.categories);

  // Image restée sur le téléphone (photo du plat, capture) ou sur un réseau social : copiée dans le stockage de
  // l'espace pour s'afficher partout et ne pas expirer. Une tentative par image et par lancement de l'app.
  const tried = useRef(new Set<string>());
  useEffect(() => {
    for (const recipe of recipes) {
      const uri = uriOf(recipe);
      if (!uri || isStoredImage(uri) || tried.current.has(uri)) continue;
      // Le web ne peut lire que les liens en ligne : un fichier d'un téléphone n'est lisible que sur ce téléphone.
      if (Platform.OS === 'web' && !/^(https?|blob):/.test(uri)) continue;
      tried.current.add(uri);
      storeRecipeImage(uri)
        .then((stored) => {
          if (!stored) return;
          setRecipes((list) =>
            list.map((r) => (r.id === recipe.id && uriOf(r) === uri ? { ...r, image: { uri: stored } } : r)),
          );
        })
        .catch(() => {});
    }
  }, [recipes]);

  const value = useMemo<RecipesState>(
    () => ({
      recipes,
      addRecipe: (recipe) => setRecipes((list) => [recipe, ...list]),
      removeRecipe: (id) => setRecipes((list) => list.filter((r) => r.id !== id)),
      categories,
      addCategory: (category) => setCategories((list) => [...list, category]),
      updateCategory: (category) => setCategories((list) => list.map((c) => (c.id === category.id ? category : c))),
      removeCategory: (id) => {
        setCategories((list) => list.filter((c) => c.id !== id));
        setRecipes((list) => list.map((r) => ({ ...r, categories: r.categories.filter((c) => c !== id) })));
      },
      setRecipeCategories: (id, ids) =>
        setRecipes((list) => list.map((r) => (r.id === id ? { ...r, categories: ids } : r))),
      setRecipeImage: (id, uri) => setRecipes((list) => list.map((r) => (r.id === id ? { ...r, image: { uri } } : r))),
      updateRecipe: (id, patch) => setRecipes((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    }),
    [recipes, categories],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

/** Adresse de l'image d'une recette ; les images de démo, dans l'app, n'en ont pas. */
function uriOf(recipe: Recipe) {
  const image = recipe.image as { uri?: unknown } | number;
  return typeof image === 'object' && image && typeof image.uri === 'string' ? image.uri : null;
}

export function useRecipes() {
  const state = useContext(RecipesContext);
  if (!state) throw new Error('useRecipes doit être utilisé sous <RecipesProvider>');
  return state;
}
