import { Image, Pressable, StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Mask, Path, Rect } from 'react-native-svg';

import { BlurGlow } from '@/components/art/BlurGlow';
import { Icon } from '@/components/icons/Icon';
import { AppText, Button, TextButton } from '@/components/ui';
import { blur, color, font, radius, shadow, space } from '@/theme/tokens';

/** Figma « Recette/ Stepp/ Fin » (452:1752) : timbre de 265 × 307, photo de 220 × 200. */
const STAMP_WIDTH = 265;
const STAMP_HEIGHT = 307;
/** Dentelure : trous de 12 px tous les 24 px, centrés sur les bords. */
const HOLE = 6;
const PITCH = 24;

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
  return (
    <View style={[styles.screen, { paddingTop, paddingBottom: insets.bottom + space[24] }]}>
      <View style={styles.main}>
        <AppText variant="display" color={color.textOnBrandPrimary} style={styles.center}>
          Bon appétit
        </AppText>

        <View>
          {/* Halo de la photo, de toute la largeur de l'écran, derrière le timbre (hors de son ombre). */}
          <View style={[styles.glow, { left: -(screenWidth - STAMP_WIDTH) / 2 }]} pointerEvents="none">
            <BlurGlow source={image} width={screenWidth} height={STAMP_HEIGHT} blur={blur.glow} />
          </View>
          <View style={styles.stamp}>
            <StampPaper />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={photoTaken ? 'Reprendre la photo' : 'Prendre une photo'}
              onPress={onTakePhoto}>
              <Image source={image} style={styles.photo} />
            </Pressable>
            <View style={styles.stampFooter}>
              <View style={styles.homemade}>
                <AppText style={styles.homemadeText} color={color.tagText}>
                  Fais maison!
                </AppText>
                <Svg width={86} height={4} style={styles.underline}>
                  <Path
                    d="M0 3C0.1 3 0.2 3 3.86 2.52C7.5 2.04 14.66 1.1 28.78 0.55C42.9 0.01 63.75 -0.11 85.66 0.09"
                    stroke={color.accentBlue}
                    strokeWidth={2.2}
                    fill="none"
                    transform="translate(0 1)"
                  />
                </Svg>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={photoTaken ? 'Reprendre la photo' : 'Prendre une photo'}
                onPress={onTakePhoto}
                style={({ pressed }) => [styles.camera, pressed && styles.pressed]}>
                <Icon name="camera" color={color.actionPrimaryText} />
              </Pressable>
            </View>
          </View>
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
  homemadeText: {
    fontFamily: font.handwritten,
    fontSize: 24,
    lineHeight: 30,
  },
  underline: {
    position: 'absolute',
    left: 41,
    bottom: -2,
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
  pressed: {
    backgroundColor: color.actionPrimaryBgPressed,
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
