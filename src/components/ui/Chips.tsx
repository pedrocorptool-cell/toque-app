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

/** Étiquette de durée ou de hashtags sur une carte recette. */
export function Tag({ label, shrink }: { label: string; shrink?: boolean }) {
  return (
    <View style={[styles.tag, shrink && styles.tagShrink]}>
      <AppText variant="label" color={color.tagText} numberOfLines={1}>
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
  chipActive: {
    backgroundColor: color.controlSelectedBg,
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
