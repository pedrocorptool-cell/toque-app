import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, BottomSheet, Button, ColorDot, FilterOptions } from '@/components/ui';
import { toHashtag, type CategoryId } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { color, radius, space, text } from '@/theme/tokens';

type SaveSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Catégories de la recette au moment de l'ouverture. */
  initial: CategoryId[];
  /** Catégories cochées ; aucune = recette retirée de toutes ses catégories. */
  onSave: (ids: CategoryId[]) => void;
};

/** Figma : « Créer une catégorie » — pastilles proposées. */
const SWATCHES = [
  color.accentOrange,
  color.accentBlue,
  color.accentGreen,
  color.accentCreme,
  color.accentLime,
  color.accentGrey,
  color.accentPurple,
  color.accentPink,
];

/** Figma : « Enregistrer » et son sous-écran « Créer une catégorie ». */
export function SaveSheet({ visible, onClose, initial, onSave }: SaveSheetProps) {
  const { categories, addCategory } = useRecipes();
  const [selected, setSelected] = useState<string[]>(initial);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [swatch, setSwatch] = useState<string>(SWATCHES[0]);

  useEffect(() => {
    if (!visible) return;
    setSelected(initial);
    setCreating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const startCreating = () => {
    setName('');
    setSwatch(SWATCHES[0]);
    setCreating(true);
  };

  const createCategory = () => {
    const id = `custom-${Date.now()}`;
    addCategory({ id, label: name.trim(), hashtag: toHashtag(name.trim()), dot: swatch });
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
        footer={<Button block label="Enregistrer" disabled={!name.trim()} onPress={createCategory} />}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nouvelle catégorie"
          placeholderTextColor={color.textSecondary}
          autoFocus
          style={styles.field}
        />
        <View style={styles.colors}>
          <AppText variant="overline" color={color.textSecondary}>
            Couleur
          </AppText>
          <View style={styles.grid}>
            {SWATCHES.map((value) => {
              const active = value === swatch;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSwatch(value)}
                  style={[styles.cell, active && styles.cellActive]}>
                  <ColorDot color={value} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Enregistrer"
      footer={
        <Button
          block
          icon="bookmark"
          label="Enregistrer"
          onPress={() => onSave(selected)}
        />
      }>
      <AppText variant="overline" color={color.textSecondary} style={styles.overline}>
        Suggestions
      </AppText>
      <FilterOptions
        firstRow={{ label: 'Nouvelle catégorie', icon: 'plus', onPress: startCreating }}
        options={categories.map((c) => ({ id: c.id, label: c.label, leading: <ColorDot color={c.dot} /> }))}
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
  field: {
    ...text.body,
    height: 48,
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
    color: color.textPrimary,
  },
  colors: {
    gap: space[8],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[8],
  },
  cell: {
    flexBasis: '22%',
    flexGrow: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.borderDefault,
  },
  cellActive: {
    backgroundColor: color.bgSurface,
  },
});
