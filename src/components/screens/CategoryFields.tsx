import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui';
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
  return (
    <View style={styles.field}>
      <AppText>#</AppText>
      <View style={styles.separator} />
      <TextInput
        value={name}
        onChangeText={onNameChange}
        placeholder="Nouvelle catégorie"
        placeholderTextColor={color.textSecondary}
        accessibilityLabel="Nom de la catégorie"
        autoFocus
        style={styles.input}
      />
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
  separator: {
    alignSelf: 'stretch',
    marginVertical: space[8],
    width: 1,
    backgroundColor: color.borderDivider,
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
