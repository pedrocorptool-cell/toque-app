import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, ColorDot } from '@/components/ui';
import { color, radius, space, text } from '@/theme/tokens';

/** Figma : « Créer une catégorie » — pastilles proposées. */
export const SWATCHES = [
  color.accentOrange,
  color.accentBlue,
  color.accentGreen,
  color.accentCreme,
  color.accentLime,
  color.accentGrey,
  color.accentPurple,
  color.accentPink,
];

type CategoryFieldsProps = {
  name: string;
  onNameChange: (name: string) => void;
  swatch: string;
  onSwatchChange: (swatch: string) => void;
};

/** Nom et couleur d'une catégorie : sheet « Enregistrer » de la recette et sheets du profil. */
export function CategoryFields({ name, onNameChange, swatch, onSwatchChange }: CategoryFieldsProps) {
  return (
    <>
      <TextInput
        value={name}
        onChangeText={onNameChange}
        placeholder="Nouvelle catégorie"
        placeholderTextColor={color.textSecondary}
        accessibilityLabel="Nom de la catégorie"
        autoFocus
        style={styles.field}
      />
      <View style={styles.colors}>
        <AppText variant="overline" color={color.textSecondary}>
          Couleur
        </AppText>
        <View style={styles.grid} accessibilityRole="radiogroup">
          {SWATCHES.map((value) => {
            const active = value === swatch;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => onSwatchChange(value)}
                style={[styles.cell, active && styles.cellActive]}>
                <ColorDot color={value} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    ...text.body,
    height: 48,
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderDefault,
    backgroundColor: color.bgSurface,
    color: color.textPrimary,
    // Sur le web, le contour de focus du navigateur s'ajouterait au liseré du champ.
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  colors: {
    gap: space[16],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[16],
  },
  cell: {
    flexBasis: '20%',
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
