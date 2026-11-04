import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { SaveSheet } from '@/components/screens/recipe/SaveSheet';
import { ShoppingSheet } from '@/components/screens/recipe/ShoppingSheet';
import { AppText, BottomSheet, Dialog, ListCard, ListRow } from '@/components/ui';
import { SHEET_DURATION } from '@/components/ui/Overlays';
import { haptics } from '@/data/haptics';
import { formatIngredient, type Recipe } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { useShopping } from '@/data/ShoppingContext';
import { color } from '@/theme/tokens';

/** Fin du toast d'ajout à la liste de courses, qui porte l'action « Voir ». */
export const LIST_TOAST_END = 'à la liste';

// Partager reviendra avec un nom de domaine pour les liens (ShareDialog est gardé pour ce moment-là).
export type RecipeSheet = 'menu' | 'save' | 'shopping' | 'delete';

type RecipeActionsProps = {
  recipe: Recipe;
  /** Sheet ouverte, tenue par l'écran : la fiche ouvre aussi « Enregistrer » depuis son bouton. */
  sheet: RecipeSheet | null;
  onSheet: (sheet: RecipeSheet | null) => void;
  /** Parts choisies, pour les quantités ajoutées à la liste de courses. */
  servings?: number;
  onToast: (message: string) => void;
  /** Recette supprimée : la fiche revient en arrière, la home n'a rien à faire. */
  onDeleted?: () => void;
};

/**
 * Figma 706:540 « Actions recette » : modifier, enregistrer, ajouter à la liste de courses, supprimer.
 * Même sheet depuis le « … » de la fiche et l'appui long sur une carte de la home.
 */
export function RecipeActions({ recipe, sheet, onSheet, servings, onToast, onDeleted }: RecipeActionsProps) {
  const { categories, removeRecipe, setRecipeCategories } = useRecipes();
  const { addFromRecipe } = useShopping();
  const parts = servings ?? recipe.servings;
  const close = () => onSheet(null);

  // La sheet des actions descend d'abord : la suivante ne s'ouvre qu'après.
  const then = (next: RecipeSheet | (() => void)) => () => {
    onSheet(null);
    setTimeout(() => (typeof next === 'function' ? next() : onSheet(next)), SHEET_DURATION);
  };

  return (
    <>
      <BottomSheet visible={sheet === 'menu'} onClose={close}>
        <ListCard>
          <ListRow
            label="Modifier"
            leading={<Icon name="edit" />}
            onPress={then(() => router.push({ pathname: '/modifier/[id]', params: { id: recipe.id } }))}
          />
          <ListRow label="Enregistrer" leading={<Icon name="bookmark" />} onPress={then('save')} />
          <ListRow label="Ajouter à la liste de courses" leading={<Icon name="basket" />} onPress={then('shopping')} />
          <ListRow
            label="Supprimer"
            danger
            leading={<Icon name="trash" color={color.feedbackDanger} />}
            onPress={then('delete')}
          />
        </ListCard>
      </BottomSheet>

      <Dialog
        visible={sheet === 'delete'}
        onClose={close}
        title="Supprimer la recette"
        message={
          <>
            Es-tu sûr de vouloir supprimer la recette <AppText style={styles.strong}>{recipe.title}</AppText> ?
          </>
        }
        confirmLabel="Oui, supprimer"
        onConfirm={() => {
          close();
          removeRecipe(recipe.id);
          onDeleted?.();
        }}
      />

      <SaveSheet
        visible={sheet === 'save'}
        onClose={close}
        initial={recipe.categories}
        onSave={(ids) => {
          close();
          setRecipeCategories(recipe.id, ids);
          if (ids.length) haptics.success();
          const labels = categories.filter((c) => ids.includes(c.id)).map((c) => c.label);
          onToast(
            labels.length ? `Recette enregistrée dans ${labels.join(', ')}` : 'Recette retirée de tes catégories',
          );
        }}
      />

      <ShoppingSheet
        visible={sheet === 'shopping'}
        onClose={close}
        items={recipe.ingredients.map((i) => formatIngredient(i, parts, recipe.servings))}
        onAdd={(selected) => {
          addFromRecipe(selected, recipe.id);
          close();
          onToast(
            selected.length > 1
              ? `${selected.length} ingrédients ajoutés ${LIST_TOAST_END}`
              : `1 ingrédient ajouté ${LIST_TOAST_END}`,
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  strong: {
    fontWeight: '600',
  },
});
