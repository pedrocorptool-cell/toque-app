import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/** Article de la liste de courses : ingrédient déjà mis à l'échelle (« 300 g de rigatoni »)
 *  ou saisi à la main. */
export type ShoppingItem = { id: string; label: string; checked: boolean; recipeId?: string };

type ShoppingState = {
  items: ShoppingItem[];
  /** Depuis la sheet « Ajouter à la liste » d'une recette ; les articles déjà à acheter ne sont pas doublés. */
  addFromRecipe: (labels: string[], recipeId: string) => void;
  /** Ajoute un article vide à la fin des articles à acheter et renvoie son id, pour le saisir aussitôt. */
  addItem: () => string;
  rename: (id: string, label: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Déplace un article à acheter à la position `to` parmi les articles à acheter. */
  move: (id: string, to: number) => void;
};

let lastId = 0;
const newId = () => `item-${++lastId}`;

/** Quelques articles de démo, dans l'esprit de la maquette (3 à acheter, 2 cochés). */
const DEMO: ShoppingItem[] = [
  { id: newId(), label: 'Lait demi-écrémé', checked: false },
  { id: newId(), label: '6 œufs', checked: false },
  { id: newId(), label: 'Beurre doux', checked: false },
  { id: newId(), label: 'Farine', checked: true },
  { id: newId(), label: 'Sucre en poudre', checked: true },
];

const ShoppingContext = createContext<ShoppingState | null>(null);

/** Liste de courses du prototype, en mémoire : elle revient à la démo au redémarrage de l'app. */
export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState(DEMO);

  const value = useMemo<ShoppingState>(
    () => ({
      items,
      addFromRecipe: (labels, recipeId) =>
        setItems((list) => {
          const fresh = labels.filter((label) => !list.some((i) => !i.checked && i.label === label));
          const added = fresh.map((label) => ({ id: newId(), label, checked: false, recipeId }));
          return [...list.filter((i) => !i.checked), ...added, ...list.filter((i) => i.checked)];
        }),
      addItem: () => {
        const id = newId();
        setItems((list) => [
          ...list.filter((i) => !i.checked),
          { id, label: '', checked: false },
          ...list.filter((i) => i.checked),
        ]);
        return id;
      },
      rename: (id, label) => setItems((list) => list.map((i) => (i.id === id ? { ...i, label } : i))),
      // Un article coché passe en tête des cochés ; décoché, il revient à la fin des articles à acheter.
      toggle: (id) =>
        setItems((list) => {
          const item = list.find((i) => i.id === id);
          if (!item) return list;
          const rest = list.filter((i) => i.id !== id);
          const toBuy = rest.filter((i) => !i.checked);
          const done = rest.filter((i) => i.checked);
          return item.checked
            ? [...toBuy, { ...item, checked: false }, ...done]
            : [...toBuy, { ...item, checked: true }, ...done];
        }),
      remove: (id) => setItems((list) => list.filter((i) => i.id !== id)),
      clear: () => setItems([]),
      move: (id, to) =>
        setItems((list) => {
          const toBuy = list.filter((i) => !i.checked);
          const from = toBuy.findIndex((i) => i.id === id);
          if (from < 0) return list;
          const [item] = toBuy.splice(from, 1);
          toBuy.splice(to, 0, item);
          return [...toBuy, ...list.filter((i) => i.checked)];
        }),
    }),
    [items],
  );

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping() {
  const state = useContext(ShoppingContext);
  if (!state) throw new Error('useShopping doit être utilisé sous <ShoppingProvider>');
  return state;
}
