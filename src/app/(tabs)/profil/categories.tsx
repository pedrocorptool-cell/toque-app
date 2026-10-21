import { useState } from 'react';

import { Icon } from '@/components/icons/Icon';
import { CategorySheet } from '@/components/screens/profile/CategorySheet';
import { ProfileScreen } from '@/components/screens/profile/ProfileScreen';
import { ColorDot, ListCard, ListRow, useToast } from '@/components/ui';
import type { Category } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { color } from '@/theme/tokens';

/** Figma : « Profil/ Catégories » — catégories avec leur nombre de recettes, création et modification. */
export default function CategoriesScreen() {
  const { categories, recipes, addCategory, updateCategory, removeCategory } = useRecipes();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Catégorie en cours de modification ; gardée pendant l'animation de fermeture de la sheet.
  const [editing, setEditing] = useState<Category | undefined>();

  const open = (category?: Category) => {
    setEditing(category);
    setSheetOpen(true);
  };

  return (
    <>
      <ProfileScreen title="Mes catégories" back toast={toast}>
        <ListCard>
          {categories.map((category) => {
            const count = recipes.filter((r) => r.categories.includes(category.id)).length;
            const countLabel = count === 0 ? 'Aucune recette' : `${count} recette${count > 1 ? 's' : ''}`;
            return (
              <ListRow
                key={category.id}
                leading={<ColorDot color={category.dot} />}
                label={category.label}
                value={countLabel}
                trailing={<Icon name="edit" color={color.actionSecondaryIcon} />}
                accessibilityLabel={`Modifier ${category.label}, ${countLabel}`}
                onPress={() => open(category)}
              />
            );
          })}
          <ListRow
            leading={<Icon name="plus" color={color.actionSecondaryIcon} />}
            label="Nouvelle catégorie"
            onPress={() => open()}
          />
        </ListCard>
      </ProfileScreen>

      <CategorySheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        category={editing}
        onSave={(category) => {
          if (editing) updateCategory(category);
          else addCategory(category);
          setSheetOpen(false);
          toast.show(editing ? 'Catégorie modifiée' : 'Catégorie créée');
        }}
        onDelete={(category) => {
          removeCategory(category.id);
          setSheetOpen(false);
          toast.show(`Catégorie ${category.label} supprimée`);
        }}
      />
    </>
  );
}
