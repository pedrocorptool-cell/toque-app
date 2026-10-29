import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
    }),
    [recipes, categories],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const state = useContext(RecipesContext);
  if (!state) throw new Error('useRecipes doit être utilisé sous <RecipesProvider>');
  return state;
}
