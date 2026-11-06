import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText, ClearButton } from '@/components/ui';
import { color, radius, space, text } from '@/theme/tokens';

type CategoryFieldsProps = {
  name: string;
  onNameChange: (name: string) => void;
};

/**
 * Nom d'une catégorie, précédé de « # » : sheet « Enregistrer » de la recette et sheets du profil
 * (Figma « V2 Sheet » 713:2882, sans couleur).
 */
export function CategoryFields({ name, onNameChange }: CategoryFieldsProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <AppText>#</AppText>
      <TextInput
        value={name}
        onChangeText={onNameChange}
        placeholder="Nouvelle catégorie"
        placeholderTextColor={color.textSecondary}
        accessibilityLabel="Nom de la catégorie"
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.input}
      />
      <ClearButton visible={focused && !!name} onClear={() => onNameChange('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
  },
  input: {
    ...text.body,
    flex: 1,
    alignSelf: 'stretch',
    color: color.textPrimary,
    // Sur le web, le contour de focus du navigateur s'ajouterait au champ.
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
});
