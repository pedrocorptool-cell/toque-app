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

type CategoryTag = { label: string; dot: string };

/**
 * Hashtags des catégories, chacun précédé d'une pastille de sa couleur (8 px). Dans une étiquette bleue sur les
 * cartes (`tone="tag"`), en blanc sur le fond de marque de la fiche (`tone="onBrand"`).
 */
export function CategoryTags({ tags, tone = 'tag' }: { tags: CategoryTag[]; tone?: 'tag' | 'onBrand' }) {
  const onBrand = tone === 'onBrand';
  return (
    <View style={styles.categoryTags}>
      {tags.map((tag, i) => (
        <View key={tag.label} style={[styles.categoryTag, i === tags.length - 1 && styles.tagShrink]}>
          <View
            style={[
              styles.categoryDot,
              { backgroundColor: tag.dot, borderColor: onBrand ? color.borderOnBrand : color.borderDivider },
            ]}
          />
          <AppText
            variant={onBrand ? undefined : 'label'}
            color={onBrand ? color.textOnBrandPrimary : color.tagText}
            numberOfLines={1}
            style={styles.tagShrink}>
            {tag.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Étiquette des hashtags d'une carte recette, avec la pastille de couleur de chaque catégorie. */
export function CategoryTag({ tags }: { tags: CategoryTag[] }) {
  return (
    <View style={[styles.tag, styles.tagShrink]}>
      <CategoryTags tags={tags} />
    </View>
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
  categoryTags: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  // Liseré discret : les teintes claires (crème) ou proches du fond (vert) restent visibles.
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
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
