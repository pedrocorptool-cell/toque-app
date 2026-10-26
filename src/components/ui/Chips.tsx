import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

/** Figma : « Chip/ Filtre » — Défaut : contour + chevron ; Actif : fond foncé. */
export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active ? styles.chipActive : styles.chipIdle, pressed && styles.pressed]}>
      <AppText variant="label" color={color.textOnBrandPrimary}>
        {label}
      </AppText>
      {!active && <Icon name="chevronDown" size={16} color={color.textOnBrandPrimary} />}
    </Pressable>
  );
}

const TAG_TONES = {
  default: { bg: color.tagBg, text: color.tagText },
  time: { bg: color.tagTimeBg, text: color.tagTimeText },
  category: { bg: color.tagCategoryBg, text: color.tagCategoryText },
  onBrand: { bg: color.tagOnBrandBg, text: color.textOnBrandPrimary },
};

/** Étiquette de durée ou de hashtags (carte recette, fiche). */
export function Tag({
  label,
  shrink,
  tone = 'default',
}: {
  label: string;
  shrink?: boolean;
  tone?: keyof typeof TAG_TONES;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: TAG_TONES[tone].bg }, shrink && styles.tagShrink]}>
      <AppText variant="label" color={TAG_TONES[tone].text} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

/** Figma : « Créateur » — avatar + nom du créateur de la recette. */
export function Creator({ name, avatar }: { name: string; avatar?: ImageSourcePropType }) {
  return (
    <View style={styles.creator}>
      {avatar ? <Image source={avatar} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarEmpty]} />}
      <AppText variant="label" color={color.textSecondary}>
        {name}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 33,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[8],
    borderRadius: radius.pill,
  },
  chipIdle: {
    borderWidth: 1,
    borderColor: color.borderOnBrand,
  },
  // Filtre actif : orange de l'action principale (Figma 464:4982).
  chipActive: {
    backgroundColor: color.actionPrimaryBg,
  },
  pressed: {
    opacity: 0.7,
  },
  tag: {
    padding: space[4],
    borderRadius: radius.sm,
    backgroundColor: color.tagBg,
  },
  tagShrink: {
    flexShrink: 1,
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarEmpty: {
    backgroundColor: color.borderDefault,
  },
});
