import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { color, radius, shadow, space, text } from '@/theme/tokens';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

/** Figma : « Search » — champ de recherche sur fond brun. */
export function SearchField({ value, onChangeText, placeholder = 'Rechercher une recette' }: SearchFieldProps) {
  return (
    <View style={styles.search}>
      <Icon name="search" color={color.textOnBrandPrimary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.textOnBrandSecondary}
        selectionColor={color.textOnBrandPrimary}
        returnKeyType="search"
        style={[styles.input, { color: color.textOnBrandPrimary }]}
      />
    </View>
  );
}

type AiChatFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  /** Génération en cours : saisie bloquée, bouton Arrêter (consigne Figma). */
  generating?: boolean;
  onStop?: () => void;
};

/** Figma : « Champ/ Chat IA » (Défaut / Génération). */
export function AiChatField({ value, onChangeText, onSubmit, generating, onStop }: AiChatFieldProps) {
  return (
    <View style={styles.chat}>
      <TextInput
        value={generating ? '' : value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        editable={!generating}
        placeholder={generating ? 'Toqué mijote ta recette…' : 'Demander à l’IA'}
        placeholderTextColor={color.textSecondary}
        returnKeyType="send"
        style={[styles.input, { color: color.textPrimary }, generating && styles.generating]}
      />
      {generating ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Arrêter la génération" onPress={onStop} hitSlop={space[8]}>
          <Icon name="stop" />
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Dicter" hitSlop={space[8]}>
          <Icon name="mic" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[12],
    borderRadius: radius.pill,
    backgroundColor: color.actionIconBg,
  },
  input: {
    flex: 1,
    ...text.body,
    paddingVertical: 0,
  },
  chat: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
    ...shadow.floating,
  },
  generating: {
    opacity: 0.6,
  },
});
