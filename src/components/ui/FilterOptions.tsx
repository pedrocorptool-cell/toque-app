import { Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Checkbox } from './Checkbox';

export type FilterOption<Id extends string> = {
  id: Id;
  label: string;
  /** Pastille de couleur, avatar ou logo affiché avant le libellé. */
  leading?: ReactNode;
};

type FilterOptionsProps<Id extends string> = {
  options: FilterOption<Id>[];
  selected: Id[];
  onChange: (next: Id[]) => void;
  /** Texte affiché quand la liste est vide (recherche sans résultat). */
  emptyLabel?: string;
};

/** Figma : liste des écrans « Filtre/ … » — lignes de 56 px séparées par un filet, case à droite. */
export function FilterOptions<Id extends string>({ options, selected, onChange, emptyLabel }: FilterOptionsProps<Id>) {
  const toggle = (id: Id) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <View style={styles.card}>
      {options.length === 0 && emptyLabel && (
        <AppText color={color.textSecondary} style={styles.empty}>
          {emptyLabel}
        </AppText>
      )}
      {options.map((option, index) => {
        const checked = selected.includes(option.id);
        return (
          <Fragment key={option.id}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={option.label}
              onPress={() => toggle(option.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              {option.leading}
              <AppText style={styles.label} numberOfLines={1}>
                {option.label}
              </AppText>
              <View pointerEvents="none">
                <Checkbox checked={checked} />
              </View>
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

/** Pastille de couleur des catégories (Figma : 18 px). */
export function ColorDot({ color: fill }: { color: string }) {
  return <View style={[styles.dot, { backgroundColor: fill }]} />;
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[16],
  },
  pressed: {
    backgroundColor: color.bgPage,
  },
  label: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: color.bgPage,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  empty: {
    padding: space[16],
  },
});
