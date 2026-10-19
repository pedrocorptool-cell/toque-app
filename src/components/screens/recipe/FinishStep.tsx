import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText } from '@/components/ui';
import { color, radius, shadow, space, text } from '@/theme/tokens';

type FinishStepProps = {
  /** Vignette actuelle de la recette. */
  image: ImageSourcePropType;
  /** Une photo vient d'être prise : elle est déjà la vignette. */
  photoTaken: boolean;
  onTakePhoto: () => void;
};

/**
 * Écran de fin du mode étape par étape (pas de maquette) : la vignette, posée comme un tirage photo, se touche pour
 * être remplacée par la photo du plat.
 */
export function FinishStep({ image, photoTaken, onTakePhoto }: FinishStepProps) {
  return (
    <View style={styles.finish}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photoTaken ? 'Reprendre la photo' : 'Prendre une photo'}
        onPress={onTakePhoto}
        style={({ pressed }) => [styles.print, pressed && styles.pressed]}>
        <Image source={image} style={styles.photo} />
        {photoTaken ? (
          <View style={styles.retake}>
            <Icon name="camera" size={16} color={color.actionSecondaryIcon} />
          </View>
        ) : (
          <View style={styles.veil}>
            <View style={styles.cameraBadge}>
              <Icon name="camera" color={color.actionSecondaryIcon} />
            </View>
          </View>
        )}
      </Pressable>

      <View style={styles.heading}>
        <AppText variant="display" color={color.textOnBrandPrimary} style={styles.center}>
          {/* Espace insécable avant « ! » : le point d'exclamation ne passe pas seul à la ligne. */}
          {photoTaken ? 'Joli plat !' : 'Bon appétit !'}
        </AppText>
        <AppText style={[styles.message, styles.center]} color={color.textOnBrandMuted}>
          {photoTaken
            ? 'Ta photo est maintenant la vignette de la recette.'
            : 'Immortalise ton plat : touche la vignette pour la remplacer par ta photo.'}
        </AppText>
      </View>
    </View>
  );
}

const PRINT = 232;

const styles = StyleSheet.create({
  finish: {
    alignItems: 'center',
    gap: space[32],
  },
  print: {
    width: PRINT,
    height: PRINT,
    padding: space[8],
    borderRadius: radius.lg,
    backgroundColor: color.borderPhoto,
    transform: [{ rotate: '-4deg' }],
    ...shadow.floating,
  },
  pressed: {
    opacity: 0.9,
  },
  photo: {
    flex: 1,
    width: '100%',
    borderRadius: radius.md,
  },
  veil: {
    position: 'absolute',
    top: space[8],
    right: space[8],
    bottom: space[8],
    left: space[8],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: color.overlayScrim,
  },
  cameraBadge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
  },
  retake: {
    position: 'absolute',
    right: -space[8],
    bottom: -space[8],
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
  },
  heading: {
    gap: space[16],
    paddingHorizontal: space[16],
  },
  center: {
    textAlign: 'center',
  },
  message: {
    ...text.body,
    fontSize: 18,
    lineHeight: 24,
  },
});
