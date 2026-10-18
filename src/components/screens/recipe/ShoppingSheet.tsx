import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText, BottomSheet, Button, FilterOptions } from '@/components/ui';
import { color, space } from '@/theme/tokens';

type ShoppingSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Ingrédients déjà mis à l'échelle du nombre de parts choisi. */
  items: string[];
  onAdd: (selected: string[]) => void;
};

/** Figma : « Ajouter à la liste de courses » — tout est coché à l'ouverture. */
export function ShoppingSheet({ visible, onClose, items, onAdd }: ShoppingSheetProps) {
  const [selected, setSelected] = useState<string[]>(items);

  useEffect(() => {
    if (visible) setSelected(items);
    // Repart de « tout coché » à chaque ouverture, pas à chaque changement de parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Ajouter à la liste de courses"
      footer={
        <Button
          block
          icon="plus"
          label="Ajouter"
          disabled={selected.length === 0}
          onPress={() => onAdd(items.filter((i) => selected.includes(i)))}
        />
      }>
      <AppText variant="overline" color={color.textSecondary} style={styles.overline}>
        {`${items.length} ingrédients`}
      </AppText>
      <FilterOptions
        options={items.map((label) => ({ id: label, label }))}
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
