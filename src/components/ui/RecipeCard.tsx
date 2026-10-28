import { useRef } from 'react';
import { Animated, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Creator, Tag } from './Chips';
import { useReduceMotion } from './useReduceMotion';
import { Tappable } from './Tappable';

/** Apparition de la photo une fois chargée, sur le fond beige qui tient sa place. */
const PHOTO_FADE = 250;

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
  const reduceMotion = useReduceMotion();
  const photo = useRef(new Animated.Value(0)).current;
  const showPhoto = () =>
    Animated.timing(photo, { toValue: 1, duration: reduceMotion ? 0 : PHOTO_FADE, useNativeDriver: true }).start();

  return (
    <Tappable feedback="card" accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.image}>
        <Animated.Image
          source={image}
          style={[styles.photo, { opacity: photo }]}
          resizeMode="cover"
          onLoad={showPhoto}
          onError={showPhoto}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.tags}>
            <Tag label={duration} tone="time" />
            {hashtags && <Tag label={hashtags} tone="category" shrink />}
          </View>
          <AppText variant="cardTitle" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <Creator {...creator} />
      </View>
    </Tappable>
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
  image: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: color.bgSkeleton,
  },
  photo: {
    width: '100%',
    height: '100%',
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
