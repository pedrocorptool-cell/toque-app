import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, TextButton } from '@/components/ui';
import { color, space } from '@/theme/tokens';

/** Durée de l'import simulé : de quoi voir l'animation tourner deux fois. */
export const IMPORT_DURATION = 4200;

export const PLATE = require('@/assets/images/illus/plate.png');
export const FORK = require('@/assets/images/illus/fork.png');
export const KNIFE = require('@/assets/images/illus/knife.png');

// Figma « Import en cours » (493:2221) : positions dans le groupe d'illustration de 352 × 285.
// Reprises par l'onboarding, où les ingrédients se posent dans l'assiette.
export const ART = { width: 352, height: 285 };
export const PLATE_BOX = { left: 52, top: 134, width: 258, height: 151 };
export const FORK_BOX = { left: 0, top: 129, width: 81, height: 113 };
export const KNIFE_BOX = { left: 268, top: 130, width: 83, height: 138 };
/** Centre du creux de l'assiette, où les ingrédients disparaissent. */
const WELL = { x: 188, y: 196 };

export const INGREDIENTS = [
  { image: require('@/assets/images/illus/olive.png'), box: { left: 138, top: 0, width: 61, height: 73 }, spin: 40 },
  { image: require('@/assets/images/illus/onion.png'), box: { left: 191, top: 55, width: 78, height: 82 }, spin: -30 },
  { image: require('@/assets/images/illus/tomato.png'), box: { left: 113, top: 91, width: 82, height: 87 }, spin: 25 },
];

const FALL = 650;
const SINK = 200;
const STAGGER = 300;
const PAUSE = 600;

/**
 * Figma « Import en cours » : plein écran brun, assiette et couverts. Les trois ingrédients tombent l'un après
 * l'autre dans l'assiette, puis la boucle reprend après une courte pause.
 */
export function ImportLoading({ visible, onCancel }: { visible: boolean; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={[styles.screen, { paddingBottom: insets.bottom + space[24] }]}>
        <View style={styles.main}>
          <View style={styles.art}>
            <Image source={FORK} style={[styles.abs, FORK_BOX]} />
            <Image source={KNIFE} style={[styles.abs, KNIFE_BOX]} />
            <Image source={PLATE} style={[styles.abs, PLATE_BOX]} />
            {visible && <FallingIngredients />}
          </View>
          <View style={styles.texts}>
            <AppText variant="headline" color={color.textOnBrandPrimary} style={styles.center}>
              Import en cours
            </AppText>
            <AppText color={color.textOnBrandSecondary} style={[styles.center, styles.message]}>
              On importe ta recette, elle sera prête d’ici un instant !
            </AppText>
          </View>
        </View>
        <TextButton tone="onBrand" label="Annuler" onPress={onCancel} />
      </View>
    </Modal>
  );
}

function FallingIngredients() {
  const progress = useRef(INGREDIENTS.map(() => new Animated.Value(0))).current;
  // « Réduire les animations » : les ingrédients restent posés comme dans la maquette, sans boucle.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion, () => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const cycle = Animated.sequence([
      Animated.parallel(
        progress.map((value, i) =>
          Animated.sequence([
            Animated.delay(i * STAGGER),
            Animated.timing(value, {
              toValue: 1,
              duration: FALL,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: 2,
              duration: SINK,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
      Animated.delay(PAUSE),
      // Remise en haut, invisible.
      Animated.parallel(
        progress.map((value) => Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true })),
      ),
    ]);
    const loop = Animated.loop(cycle);
    loop.start();
    return () => loop.stop();
  }, [progress, reduceMotion]);

  if (reduceMotion) {
    return INGREDIENTS.map(({ image, box }, i) => <Image key={i} source={image} style={[styles.abs, box]} />);
  }

  return INGREDIENTS.map(({ image, box, spin }, i) => {
    const value = progress[i];
    // De 0 à 1 : chute depuis 140 px au-dessus de sa place Figma jusqu'au creux de l'assiette ;
    // de 1 à 2 : l'ingrédient s'enfonce (rétrécit et s'efface).
    const landX = WELL.x - (box.left + box.width / 2);
    const landY = WELL.y - (box.top + box.height / 2) - box.height * 0.2;
    const style = {
      opacity: value.interpolate({ inputRange: [0, 0.15, 1, 2], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: value.interpolate({ inputRange: [0, 1, 2], outputRange: [0, landX, landX] }) },
        { translateY: value.interpolate({ inputRange: [0, 1, 2], outputRange: [-140, landY, landY + 8] }) },
        { rotate: value.interpolate({ inputRange: [0, 1, 2], outputRange: ['0deg', `${spin}deg`, `${spin}deg`] }) },
        { scale: value.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 0.85, 0.4] }) },
      ],
    };
    return <Animated.Image key={i} source={image} style={[styles.abs, box, style]} />;
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 180,
    paddingHorizontal: space[16],
    backgroundColor: color.bgBrandPage,
  },
  main: {
    alignItems: 'center',
    gap: space[40],
  },
  art: {
    width: ART.width,
    height: ART.height,
  },
  abs: {
    position: 'absolute',
  },
  texts: {
    alignItems: 'center',
    gap: space[16],
    maxWidth: 259,
  },
  center: {
    textAlign: 'center',
  },
  message: {
    lineHeight: 24,
  },
});
