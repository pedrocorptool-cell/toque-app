import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { color, radius, shadow, space, text } from '@/theme/tokens';

import { Tappable } from './Tappable';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** onBrand : sur fond brun, avec loupe (home) · surface : fond blanc sans loupe (filtre Créateur). */
  tone?: 'onBrand' | 'surface';
};

/** Figma : « Search » — champ de recherche. */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Rechercher une recette',
  tone = 'onBrand',
}: SearchFieldProps) {
  const onBrand = tone === 'onBrand';
  const ink = onBrand ? color.textOnBrandPrimary : color.textPrimary;
  return (
    <View style={[styles.search, !onBrand && styles.searchSurface]}>
      {onBrand && <Icon name="search" color={ink} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={onBrand ? color.textOnBrandSecondary : color.textSecondary}
        selectionColor={ink}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={[styles.input, { color: ink }]}
      />
      {value.length > 0 && (
        <Tappable
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
          onPress={() => onChangeText('')}
          hitSlop={space[8]}>
          <Icon name="close" size={16} color={ink} />
        </Tappable>
      )}
    </View>
  );
}

type BrandFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  /** Erreur : contour rouge, le message est affiché à part. */
  invalid?: boolean;
};

/** Figma « Onbarding » (748:6064) : champ de saisie sur le fond brun, comme la recherche sans loupe. */
export function BrandField({ invalid, ...props }: BrandFieldProps) {
  return (
    <View style={[styles.search, styles.brandField, invalid && styles.brandFieldInvalid]}>
      <TextInput
        {...props}
        placeholderTextColor={color.textOnBrandSecondary}
        selectionColor={color.textOnBrandPrimary}
        style={[styles.input, { color: color.textOnBrandPrimary }, WEB_NO_OUTLINE]}
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
        <Tappable
          accessibilityRole="button"
          accessibilityLabel="Arrêter la génération"
          onPress={onStop}
          hitSlop={space[8]}>
          <Icon name="stop" />
        </Tappable>
      ) : (
        <Tappable accessibilityRole="button" accessibilityLabel="Dicter" hitSlop={space[8]}>
          <Icon name="mic" />
        </Tappable>
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
    backgroundColor: color.bgBrandField,
  },
  brandField: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  brandFieldInvalid: {
    borderColor: color.feedbackDanger,
  },
  searchSurface: {
    paddingHorizontal: space[16],
    backgroundColor: color.bgSurface,
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

// Sur le web, le contour de focus du navigateur s'ajouterait au champ.
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;
