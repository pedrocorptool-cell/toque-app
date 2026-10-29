import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Mask, Path, Rect } from 'react-native-svg';

import { BlurGlow } from '@/components/art/BlurGlow';
import { Icon } from '@/components/icons/Icon';
import { AppText, Button, TextButton, useReduceMotion, Tappable } from '@/components/ui';
import { haptics } from '@/data/haptics';
import { motion } from '@/theme/motion';
import { blur, color, font, radius, shadow, space } from '@/theme/tokens';

/** Figma « Recette/ Stepp/ Fin » (452:1752) : timbre de 265 × 307, photo de 220 × 200. */
const STAMP_WIDTH = 265;
const STAMP_HEIGHT = 307;
/** Dentelure : trous de 12 px tous les 24 px, centrés sur les bords. */
const HOLE = 6;
const PITCH = 24;

/** Le timbre se pose après le fondu de l'écran : un peu agrandi et penché, il se remet en place avec un léger rebond. */
const STAMP_DELAY = 150;
const STAMP_SPRING = { stiffness: 160, damping: 20, mass: 1 };
const STAMP_SCALE = 1.08;
const STAMP_TILT = '-6deg';
/** Puis « Fais maison! » se souligne comme au stylo. */
const UNDERLINE_WIDTH = 86;
const UNDERLINE_DELAY = 450;
const UNDERLINE_DURATION = 300;
/** Fondu enchaîné entre l'ancienne vignette et la photo prise. */
const PHOTO_FADE = 250;

type FinishStepProps = {
  /** Vignette actuelle de la recette (la photo prise, une fois remplacée). */
  image: ImageSourcePropType;
  photoTaken: boolean;
  onTakePhoto: () => void;
  onDone: () => void;
  onBack: () => void;
};

/** Écran de fin du mode étape par étape : la vignette en timbre, à remplacer par la photo du plat. */
export function FinishStep({ image, photoTaken, onTakePhoto, onDone, onBack }: FinishStepProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  // Figma : titre à 80 px du haut de l'écran, barre d'état comprise.
  const paddingTop = Math.max(space[80], insets.top + space[24]);
  const reduceMotion = useReduceMotion();
  const landing = useRef(new Animated.Value(0)).current;
  const underline = useRef(new Animated.Value(0)).current;

  // Le timbre qui se pose vibre une fois, au moment où il touche l'écran.
  useEffect(() => {
    const t = setTimeout(haptics.success, reduceMotion ? 0 : STAMP_DELAY);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      landing.setValue(1);
      underline.setValue(1);
      return;
    }
    const intro = Animated.parallel([
      Animated.sequence([
        Animated.delay(STAMP_DELAY),
        Animated.spring(landing, { toValue: 1, ...STAMP_SPRING, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(UNDERLINE_DELAY),
        // La largeur révélée n'est pas animable par le driver natif.
        Animated.timing(underline, {
          toValue: 1,
          duration: UNDERLINE_DURATION,
          easing: motion.easeOut,
          useNativeDriver: false,
        }),
      ]),
    ]);
    intro.start();
    return () => intro.stop();
  }, [reduceMotion, landing, underline]);

  const stampMotion = {
    opacity: landing.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
    transform: [
      { scale: landing.interpolate({ inputRange: [0, 1], outputRange: [STAMP_SCALE, 1] }) },
      { rotate: landing.interpolate({ inputRange: [0, 1], outputRange: [STAMP_TILT, '0deg'] }) },
    ],
  };
  return (
    <View style={[styles.screen, { paddingTop, paddingBottom: insets.bottom + space[24] }]}>
      <View style={styles.main}>
        {/* Au-dessus du halo, qui déborde maintenant vers le haut. */}
        <AppText variant="display" color={color.textOnBrandPrimary} style={[styles.center, styles.title]}>
          Bon appétit
        </AppText>

        <View>
          {/* Halo de la photo, de toute la largeur de l'écran, derrière le timbre (hors de son ombre). */}
          <View style={[styles.glow, { left: -(screenWidth - STAMP_WIDTH) / 2 }]} pointerEvents="none">
            <BlurGlow source={image} width={screenWidth} height={STAMP_HEIGHT} blur={blur.glow} bleed />
          </View>
          <Animated.View style={[styles.stamp, stampMotion]}>
            <StampPaper />
            <Tappable
              feedback="card"
              accessibilityRole="button"
              accessibilityLabel={photoTaken ? 'Reprendre la photo' : 'Prendre une photo'}
              onPress={onTakePhoto}>
              <CrossfadePhoto source={image} instant={reduceMotion} />
            </Tappable>
            <View style={styles.stampFooter}>
              <View style={styles.homemade}>
                <AppText style={styles.homemadeText} color={color.tagText}>
                  Fais maison!
                </AppText>
                {/* Trait dévoilé de gauche à droite : un tracé SVG animé déclenche un avertissement sur le web. */}
                <Animated.View
                  style={[
                    styles.underline,
                    { width: underline.interpolate({ inputRange: [0, 1], outputRange: [0, UNDERLINE_WIDTH] }) },
                  ]}>
                  <Svg width={UNDERLINE_WIDTH} height={4}>
                    <Path
                      d="M0 3C0.1 3 0.2 3 3.86 2.52C7.5 2.04 14.66 1.1 28.78 0.55C42.9 0.01 63.75 -0.11 85.66 0.09"
                      stroke={color.accentBlue}
                      strokeWidth={2.2}
                      fill="none"
                      transform="translate(0 1)"
                    />
                  </Svg>
                </Animated.View>
              </View>
              <Tappable
                feedback="surface"
                accessibilityRole="button"
                accessibilityLabel={photoTaken ? 'Reprendre la photo' : 'Prendre une photo'}
                onPress={onTakePhoto}
                style={styles.camera}>
                <Icon name="camera" color={color.actionPrimaryText} />
              </Tappable>
            </View>
          </Animated.View>
        </View>

        <AppText variant="body" color={color.textOnBrandPrimary} style={[styles.center, styles.message]}>
          {photoTaken
            ? 'Ta photo est maintenant la vignette de la recette.'
            : 'Immortalise ton plat : touche la vignette pour la remplacer par ta photo.'}
        </AppText>
      </View>

      <View style={styles.actions}>
        <TextButton tone="onBrand" label="Retour" onPress={onBack} />
        <Button variant="secondary" label="Terminer" onPress={onDone} block />
      </View>
    </View>
  );
}

/** Vignette du timbre : la nouvelle photo apparaît en fondu par-dessus l'ancienne. */
function CrossfadePhoto({ source, instant }: { source: ImageSourcePropType; instant: boolean }) {
  const [current, setCurrent] = useState(source);
  const [previous, setPrevious] = useState<ImageSourcePropType | null>(null);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (source === current) return;
    setPrevious(instant ? null : current);
    setCurrent(source);
    if (instant) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: PHOTO_FADE, easing: motion.easeOut, useNativeDriver: true }).start(
      ({ finished }) => finished && setPrevious(null),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  return (
    <View style={styles.photo}>
      {previous && <Image source={previous} style={[StyleSheet.absoluteFill, styles.photo]} />}
      <Animated.Image source={current} style={[StyleSheet.absoluteFill, styles.photo, { opacity: fade }]} />
    </View>
  );
}

/** Papier du timbre : rectangle dont les bords sont percés de demi-cercles (masque SVG). */
function StampPaper() {
  const across = Array.from({ length: Math.floor(STAMP_WIDTH / PITCH) - 1 }, (_, i) => i);
  const down = Array.from({ length: Math.floor(STAMP_HEIGHT / PITCH) }, (_, i) => i);
  const startX = (STAMP_WIDTH - (across.length - 1) * PITCH) / 2;
  const startY = (STAMP_HEIGHT - (down.length - 1) * PITCH) / 2;
  return (
    <Svg width={STAMP_WIDTH} height={STAMP_HEIGHT} style={StyleSheet.absoluteFill}>
      <Defs>
        {/* Masque en luminance : blanc = papier gardé, noir = trou. */}
        <Mask id="perforations" x={0} y={0} width={STAMP_WIDTH} height={STAMP_HEIGHT} maskUnits="userSpaceOnUse">
          <Rect width={STAMP_WIDTH} height={STAMP_HEIGHT} fill="white" />
          {across.map((i) => (
            <Circle key={`t${i}`} cx={startX + i * PITCH} cy={0} r={HOLE} fill="black" />
          ))}
          {across.map((i) => (
            <Circle key={`b${i}`} cx={startX + i * PITCH} cy={STAMP_HEIGHT} r={HOLE} fill="black" />
          ))}
          {down.map((i) => (
            <Circle key={`l${i}`} cx={0} cy={startY + i * PITCH} r={HOLE} fill="black" />
          ))}
          {down.map((i) => (
            <Circle key={`r${i}`} cx={STAMP_WIDTH} cy={startY + i * PITCH} r={HOLE} fill="black" />
          ))}
        </Mask>
      </Defs>
      <Rect width={STAMP_WIDTH} height={STAMP_HEIGHT} fill={color.bgPage} mask="url(#perforations)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
  },
  main: {
    alignItems: 'center',
    gap: space[40],
  },
  center: {
    textAlign: 'center',
  },
  stamp: {
    width: STAMP_WIDTH,
    height: STAMP_HEIGHT,
    alignItems: 'center',
    paddingTop: space[24],
    gap: space[16],
    ...shadow.floating,
  },
  glow: {
    position: 'absolute',
    top: 0,
  },
  photo: {
    width: 220,
    height: 200,
    borderRadius: radius.md,
  },
  stampFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[12],
  },
  homemade: {
    transform: [{ rotate: '-4deg' }],
  },
  title: {
    zIndex: 1,
  },
  homemadeText: {
    fontFamily: font.handwritten,
    fontSize: 24,
    lineHeight: 30,
  },
  underline: {
    position: 'absolute',
    left: 41,
    bottom: -2,
    height: 4,
    overflow: 'hidden',
  },
  camera: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.actionPrimaryBg,
    ...shadow.fab,
  },
  message: {
    maxWidth: 269,
    lineHeight: 24,
  },
  actions: {
    alignItems: 'center',
    gap: space[16],
  },
});
