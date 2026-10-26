import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Creator, Tag } from './Chips';

type RecipeCardProps = {
  title: string;
  image: ImageSourcePropType;
  duration: string;
  hashtags?: string;
  creator: { name: string; avatar?: ImageSourcePropType };
  onPress?: () => void;
};

/** Carte recette de la home (Figma : écran « Home »). */
export function RecipeCard({ title, image, duration, hashtags, creator, onPress }: RecipeCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image source={image} style={styles.image} resizeMode="cover" />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.tags}>
            <Tag label={duration} />
            {hashtags && <Tag label={hashtags} shrink />}
          </View>
          <AppText variant="cardTitle" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <Creator {...creator} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    padding: space[16],
    borderRadius: radius.xl,
    backgroundColor: color.bgSurface,
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
  },
  body: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  top: {
    gap: space[8],
  },
  tags: {
    flexDirection: 'row',
    gap: space[8],
  },
});
