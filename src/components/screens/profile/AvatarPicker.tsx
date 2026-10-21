import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AVATAR_ART_RATIO, AVATAR_FILL } from '@/components/ui/Avatar';
import { AppText, Button, ChefButton, Logo, TextButton } from '@/components/ui';
import { AVATAR_BACKGROUNDS, AVATARS, type Avatar, type AvatarId } from '@/data/profile';
import { color, radius, space } from '@/theme/tokens';

/** Rond central de 160 px, avatars voisins de 80 px séparés de 24 px (Figma « Frame 217 »). */
const BIG = 160;
const SMALL = 80;
const SLOT = (BIG + SMALL) / 2 + space[24];
/** Image de l'avatar dans le rond central (oignon de 112 px de haut). */
const ART = BIG * AVATAR_ART_RATIO;
/** Agrandissement de l'image chez les voisins, dont l'illustration remplit les 80 px sans rond. */
const SIDE_ART_SCALE = SMALL / AVATAR_FILL / ((ART * SMALL) / BIG);

type AvatarPickerProps = {
  visible: boolean;
  initial: Avatar;
  onClose: () => void;
  onSave: (avatar: Avatar) => void;
  onChef: () => void;
};

/** Figma : « Profil/ Compte » (choix d'avatar) — carrousel d'avatars Toqué et couleur de fond, plein écran. */
export function AvatarPicker({ visible, initial, onClose, onSave, onChef }: AvatarPickerProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const start = initial.kind === 'toque' ? initial : { id: 'onion' as AvatarId, background: color.accentCreme };
  const [index, setIndex] = useState(0);
  const [background, setBackground] = useState(start.background);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scroller = useRef<Animated.FlatList<(typeof AVATARS)[number]>>(null);

  useEffect(() => {
    if (!visible) return;
    const i = AVATARS.findIndex((a) => a.id === start.id);
    setIndex(i);
    setBackground(start.background);
    // Laisse la liste se mesurer avant de la placer sur l'avatar actuel.
    requestAnimationFrame(() => scroller.current?.scrollToOffset({ offset: i * SLOT, animated: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const select = (i: number) => {
    setIndex(i);
    scroller.current?.scrollToOffset({ offset: i * SLOT, animated: true });
    AccessibilityInfo.announceForAccessibility(AVATARS[i].label);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.max(0, Math.min(AVATARS.length - 1, Math.round(e.nativeEvent.contentOffset.x / SLOT))));

  const side = (width - SLOT) / 2;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top + space[24], paddingBottom: insets.bottom + space[16] }]}>
        <View style={styles.topRow}>
          <Logo />
          <ChefButton onPress={onChef} />
        </View>

        <View style={styles.main}>
          <Animated.FlatList
            ref={scroller}
            data={AVATARS}
            keyExtractor={(a) => a.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SLOT}
            decelerationRate="fast"
            style={{ width, flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: side }}
            getItemLayout={(_, i) => ({ length: SLOT, offset: i * SLOT, index: i })}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            renderItem={({ item, index: i }) => {
              const range = [(i - 1) * SLOT, i * SLOT, (i + 1) * SLOT];
              const scale = scrollX.interpolate({
                inputRange: range,
                outputRange: [SMALL / BIG, 1, SMALL / BIG],
                extrapolate: 'clamp',
              });
              const ringOpacity = scrollX.interpolate({
                inputRange: range,
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              });
              // Les voisins remplissent leur carré de 80 px, l'avatar choisi tient dans son rond.
              const artScale = scrollX.interpolate({
                inputRange: range,
                outputRange: [SIDE_ART_SCALE, 1, SIDE_ART_SCALE],
                extrapolate: 'clamp',
              });
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: i === index }}
                  onPress={() => select(i)}
                  style={styles.slot}>
                  <Animated.View style={[styles.round, { transform: [{ scale }] }]}>
                    <Animated.View style={[styles.ring, { backgroundColor: background, opacity: ringOpacity }]} />
                    <Animated.View style={{ transform: [{ scale: artScale }] }}>
                      <Image source={item.image} style={styles.art} />
                    </Animated.View>
                  </Animated.View>
                </Pressable>
              );
            }}
          />

          <View style={styles.texts}>
            <AppText variant="headline" color={color.textOnBrandPrimary} style={styles.center}>
              Choisis un avatar Toqué !
            </AppText>
            <AppText color={color.textOnBrandSecondary} style={[styles.center, styles.message]}>
              Fais défiler les avatars et choisis une couleur de fond.
            </AppText>
          </View>

          <View style={styles.colors} accessibilityRole="radiogroup">
            {AVATAR_BACKGROUNDS.map((value) => {
              const active = value === background;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityLabel="Couleur de fond"
                  accessibilityState={{ selected: active }}
                  onPress={() => setBackground(value)}
                  style={[styles.cell, active && styles.cellActive]}>
                  <View style={[styles.dot, { backgroundColor: value }]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            block
            variant="secondary"
            icon="bookmark"
            label="Enregistrer"
            onPress={() => onSave({ kind: 'toque', id: AVATARS[index].id, background })}
          />
          <TextButton tone="onBrand" label="Annuler" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
    backgroundColor: color.bgBrandPage,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  texts: {
    alignItems: 'center',
    gap: space[16],
    maxWidth: 285,
  },
  center: {
    textAlign: 'center',
  },
  message: {
    lineHeight: 24,
  },
  colors: {
    width: 259,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[16],
  },
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
    backgroundColor: color.bgSurface,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  actions: {
    alignItems: 'center',
    gap: space[24],
  },
});
