/** Article de la liste de courses : ingrédient déjà mis à l'échelle (« 300 g de rigatoni »)
 *  ou saisi à la main. */
export type ShoppingItem = { id: string; label: string; checked: boolean; recipeId?: string };

/** Aléatoire, pour ne pas reprendre l'id d'un article enregistré lors d'un lancement précédent. */
export const newItemId = () => `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Quelques articles de démo, dans l'esprit de la maquette (3 à acheter, 2 cochés), pour le mode hors ligne. */
export const DEMO_SHOPPING: ShoppingItem[] = [
  { id: 'item-1', label: 'Lait demi-écrémé', checked: false },
  { id: 'item-2', label: '6 œufs', checked: false },
  { id: 'item-3', label: 'Beurre doux', checked: false },
  { id: 'item-4', label: 'Farine', checked: true },
  { id: 'item-5', label: 'Sucre en poudre', checked: true },
];
