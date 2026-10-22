import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AVATAR_ART_RATIO, AVATAR_FILL } from '@/components/ui/Avatar';
import { AVATAR_BACKGROUNDS, AVATARS, type AvatarId } from '@/data/profile';
import { color, radius, space } from '@/theme/tokens';

/** Rond central de 160 px, avatars voisins de 80 px séparés de 24 px (Figma « Frame 217 »). */
const BIG = 160;
const SMALL = 80;
const SLOT = (BIG + SMALL) / 2 + space[24];
/** Image de l'avatar dans le rond central (cadre de 120 px). */
const ART = BIG * AVATAR_ART_RATIO;
/** Agrandissement de l'image chez les voisins, dont l'illustration remplit les 80 px sans rond. */
const SIDE_ART_SCALE = SMALL / AVATAR_FILL / ((ART * SMALL) / BIG);

/**
 * Carrousel sans fin : la liste répète les avatars, on démarre au milieu et on y revient sans animation dès
 * qu'on s'approche d'un bord. Un avatar qui sort par la gauche revient ainsi par la droite.
 * ScrollView plutôt que FlatList : le carrousel vit aussi dans les pages de l'onboarding, déjà une liste horizontale.
 */
const COUNT = AVATARS.length;
const REPEAT = 10;
const LOOP = Array.from({ length: COUNT * REPEAT }, (_, k) => AVATARS[k % COUNT]);
const MIDDLE = COUNT * (REPEAT / 2);
const MARGIN = COUNT * 2;

const recenter = (k: number) => (k < MARGIN || k > LOOP.length - 1 - MARGIN ? MIDDLE + (k % COUNT) : k);

type AvatarChooserProps = {
  avatarId: AvatarId;
  onAvatarChange: (id: AvatarId) => void;
  background: string;
  onBackgroundChange: (background: string) => void;
  /** Textes entre le carrousel et les couleurs. */
  children: ReactNode;
};

/** Figma « Avatar » : carrousel d'avatars Toqué en boucle et couleur de fond (choix d'avatar du profil, onboarding). */
export function AvatarChooser({
  avatarId,
  onAvatarChange,
  background,
  onBackgroundChange,
  children,
}: AvatarChooserProps) {
  const { width } = useWindowDimensions();
  const [position, setPosition] = useState(() => MIDDLE + AVATARS.findIndex((a) => a.id === avatarId));
  const scrollX = useRef(new Animated.Value(position * SLOT)).current;
  const scroller = useRef<ScrollView>(null);

  // Laisse la liste se mesurer avant de la placer sur l'avatar de départ.
  useEffect(() => {
    requestAnimationFrame(() => scroller.current?.scrollTo({ x: position * SLOT, animated: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = (k: number) => {
    const next = recenter(k);
    if (next !== k) scroller.current?.scrollTo({ x: next * SLOT, animated: false });
    setPosition(next);
    const avatar = AVATARS[next % COUNT];
    if (avatar.id !== avatarId) {
      onAvatarChange(avatar.id);
      AccessibilityInfo.announceForAccessibility(avatar.label);
    }
  };

  const select = (k: number) => {
    scroller.current?.scrollTo({ x: k * SLOT, animated: true });
    settle(k);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    settle(Math.round(e.nativeEvent.contentOffset.x / SLOT));

  return (
    <View style={styles.main}>
      <Animated.ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLOT}
        decelerationRate="fast"
        contentOffset={{ x: position * SLOT, y: 0 }}
        style={{ width, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: (width - SLOT) / 2 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}>
        {LOOP.map((item, k) => {
          const range = [(k - 1) * SLOT, k * SLOT, (k + 1) * SLOT];
          const scale = scrollX.interpolate({
            inputRange: range,
            outputRange: [SMALL / BIG, 1, SMALL / BIG],
            extrapolate: 'clamp',
          });
          const ringOpacity = scrollX.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp' });
          // Les voisins remplissent leur carré de 80 px, l'avatar choisi tient dans son rond.
          const artScale = scrollX.interpolate({
            inputRange: range,
            outputRange: [SIDE_ART_SCALE, 1, SIDE_ART_SCALE],
            extrapolate: 'clamp',
          });
          return (
            <Pressable
              key={k}
              accessibilityRole="radio"
              accessibilityLabel={item.label}
              accessibilityState={{ checked: k === position }}
              onPress={() => select(k)}
              style={styles.slot}>
              <Animated.View style={[styles.round, { transform: [{ scale }] }]}>
                <Animated.View style={[styles.ring, { backgroundColor: background, opacity: ringOpacity }]} />
                <Animated.View style={{ transform: [{ scale: artScale }] }}>
                  <Image source={item.image} style={styles.art} />
                </Animated.View>
              </Animated.View>
            </Pressable>
          );
        })}
      </Animated.ScrollView>

      {children}

      <View style={styles.colors} accessibilityRole="radiogroup">
        {AVATAR_BACKGROUNDS.map((value) => {
          const active = value === background;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityLabel="Couleur de fond"
              accessibilityState={{ checked: active }}
              onPress={() => onBackgroundChange(value)}
              style={[styles.cell, active && styles.cellActive]}>
              <View style={[styles.dot, { backgroundColor: value }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    alignItems: 'center',
    gap: space[40],
  },
  slot: {
    width: SLOT,
    height: BIG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: {
    width: BIG,
    height: BIG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: BIG / 2,
  },
  art: {
    width: ART,
    height: ART,
  },
  colors: {
    width: 259,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[16],
  },
  // Figma « Frame 204 » : liseré clair, fond brun foncé pour la couleur choisie.
  cell: {
    width: 120,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.borderDefault,
  },
  cellActive: {
    backgroundColor: color.bgBrandSurface,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
});
