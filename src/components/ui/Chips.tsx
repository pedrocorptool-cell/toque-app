import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Tappable } from './Tappable';

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

/** Figma : « Chip/ Filtre » — Défaut : contour + chevron ; Actif : fond foncé. */
export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
      <AppText variant="label" color={color.textOnBrandPrimary}>
        {label}
      </AppText>
      {!active && <Icon name="chevronDown" size={16} color={color.textOnBrandPrimary} />}
    </Tappable>
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
      <AppText variant="label" color={TAG_TONES[tone].text} numberOfLines={1} style={shrink && styles.tagShrink}>
        {label}
      </AppText>
    </View>
  );
}

/** Figma : « Créateur » — avatar + nom du créateur de la recette ; le nom seul quand l'import n'a pas trouvé
 *  d'avatar. */
export function Creator({ name, avatar }: { name: string; avatar?: ImageSourcePropType }) {
  return (
    <View style={styles.creator}>
      {avatar && <Image source={avatar} style={styles.avatar} />}
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
});
