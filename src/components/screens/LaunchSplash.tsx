import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, useReduceMotion } from '@/components/ui';
import { color, space } from '@/theme/tokens';

const SPLASH = require('@/assets/images/splash-icon.png');
/** Même largeur que l'écran de lancement natif (app.json), pour que l'icône et le logo ne bougent pas. */
const IMAGE_WIDTH = 202;
const IMAGE_HEIGHT = (IMAGE_WIDTH * 624) / 606;
/** Le temps de lire la phrase, puis l'app apparaît en fondu. */
const HOLD = 900;
const FADE = 300;

/**
 * Figma « Splash Screen » (769:7938) : le lancement natif ne sait afficher qu'une image centrée ; cette vue
 * le prolonge à l'identique et ajoute la phrase du bas, puis s'efface sur l'app.
 */
export function LaunchSplash() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(HOLD),
      Animated.timing(opacity, { toValue: 0, duration: reduceMotion ? 0 : FADE, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => finished && setDone(true));
    return () => anim.stop();
  }, [opacity, reduceMotion]);

  if (done) return null;
  return (
    <Animated.View style={[styles.screen, { opacity }]} pointerEvents="none">
      <Image source={SPLASH} style={styles.image} accessibilityIgnoresInvertColors />
      <View style={[styles.tagline, { bottom: insets.bottom + space[24] }]}>
        <AppText variant="cardTitle" color={color.textOnBrandPrimary}>
          Importe tes recettes les plus folles.
        </AppText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bgBrandPage,
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  tagline: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    alignItems: 'center',
  },
});
