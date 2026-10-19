import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { RECIPES, type Recipe } from './recipes';

/** Article de la liste de courses : ingrédient déjà mis à l'échelle (« 300 g de rigatoni »). */
export type ShoppingItem = { label: string; recipeId: string };

type RecipesState = {
  recipes: Recipe[];
  removeRecipe: (id: string) => void;
  /** Remplace la vignette par la photo du plat prise en fin de recette. */
  setRecipeImage: (id: string, uri: string) => void;
  shoppingList: ShoppingItem[];
  addToShoppingList: (items: ShoppingItem[]) => void;
};

const RecipesContext = createContext<RecipesState | null>(null);

/** État partagé du prototype, en mémoire : tout revient à zéro au redémarrage de l'app. */
export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState(RECIPES);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  const value = useMemo<RecipesState>(
    () => ({
      recipes,
      removeRecipe: (id) => setRecipes((list) => list.filter((r) => r.id !== id)),
      setRecipeImage: (id, uri) => setRecipes((list) => list.map((r) => (r.id === id ? { ...r, image: { uri } } : r))),
      shoppingList,
      addToShoppingList: (items) =>
        setShoppingList((list) => [...list, ...items.filter((i) => !list.some((l) => l.label === i.label))]),
    }),
    [recipes, shoppingList],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes() {
  const state = useContext(RecipesContext);
  if (!state) throw new Error('useRecipes doit être utilisé sous <RecipesProvider>');
  return state;
}
