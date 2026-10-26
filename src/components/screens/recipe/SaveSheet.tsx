import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CategoryFields } from '@/components/screens/CategoryFields';
import { AppText, BottomSheet, Button, FilterOptions } from '@/components/ui';
import { toHashtag, type CategoryId } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { color, space } from '@/theme/tokens';

type SaveSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Catégories de la recette au moment de l'ouverture. */
  initial: CategoryId[];
  /** Catégories cochées ; aucune = recette retirée de toutes ses catégories. */
  onSave: (ids: CategoryId[]) => void;
};

/** Figma : « Enregistrer » et son sous-écran « Créer une catégorie ». */
export function SaveSheet({ visible, onClose, initial, onSave }: SaveSheetProps) {
  const { categories, addCategory } = useRecipes();
  const [selected, setSelected] = useState<string[]>(initial);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSelected(initial);
    setCreating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const startCreating = () => {
    setName('');
    setCreating(true);
  };

  const createCategory = () => {
    const id = `custom-${Date.now()}`;
    addCategory({ id, label: name.trim(), hashtag: toHashtag(name.trim()) });
    setSelected([...selected, id]);
    setCreating(false);
  };

  if (creating) {
    return (
      <BottomSheet
        visible={visible}
        onClose={onClose}
        onBack={() => setCreating(false)}
        title="Créer une catégorie"
        footer={<Button block icon="bookmark" label="Enregistrer" disabled={!name.trim()} onPress={createCategory} />}>
        <CategoryFields name={name} onNameChange={setName} />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Enregistrer"
      footer={<Button block icon="bookmark" label="Enregistrer" onPress={() => onSave(selected)} />}>
      <AppText variant="overline" color={color.textSecondary} style={styles.overline}>
        Suggestions
      </AppText>
      <FilterOptions
        firstRow={{ label: 'Nouvelle catégorie', icon: 'plus', onPress: startCreating }}
        options={categories.map((c) => ({ id: c.id, label: c.hashtag ?? toHashtag(c.label) }))}
        selected={selected}
        onChange={setSelected}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  overline: {
    marginBottom: -space[16],
  },
});
