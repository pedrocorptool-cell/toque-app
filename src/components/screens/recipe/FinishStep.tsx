import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText, Button, TextButton } from '@/components/ui';
import { color, radius, space, text } from '@/theme/tokens';

type FinishStepProps = {
  /** Photo prise par l'utilisateur, une fois la vignette remplacée. */
  photo: ImageSourcePropType | null;
  onTakePhoto: () => void;
  onDone: () => void;
};

/** Écran de fin du mode étape par étape (pas de maquette) : invite à photographier son plat pour la vignette. */
export function FinishStep({ photo, onTakePhoto, onDone }: FinishStepProps) {
  return (
    <View style={styles.finish}>
      <View style={styles.heading}>
        <AppText variant="display" color={color.textOnBrandPrimary}>
          {/* Espace insécable avant « ! » : le point d'exclamation ne passe pas seul à la ligne. */}
          {photo ? 'Joli plat\u00A0!' : 'Bon appétit\u00A0!'}
        </AppText>
        <AppText style={styles.message} color={color.textOnBrandMuted}>
          {photo
            ? 'Ta photo remplace maintenant la vignette de la recette.'
            : 'Ton plat est prêt. Prends-le en photo pour remplacer la vignette de la recette.'}
        </AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photo ? 'Reprendre la photo' : 'Prendre une photo'}
        onPress={onTakePhoto}
        style={({ pressed }) => [
          styles.frame,
          photo ? styles.framePhoto : styles.frameEmpty,
          pressed && styles.pressed,
        ]}>
        {photo ? (
          <Image source={photo} style={StyleSheet.absoluteFill} />
        ) : (
          <>
            <View style={styles.cameraBadge}>
              <Icon name="camera" color={color.actionSecondaryIcon} />
            </View>
            <AppText variant="label" color={color.textOnBrandSecondary}>
              Ton plat ici
            </AppText>
          </>
        )}
      </Pressable>

      <View style={styles.actions}>
        {photo ? (
          <>
            <Button label="Terminer" onPress={onDone} block />
            <TextButton tone="onBrand" icon="camera" label="Reprendre la photo" onPress={onTakePhoto} />
          </>
        ) : (
          <>
            <Button icon="camera" label="Prendre une photo" onPress={onTakePhoto} block />
            <TextButton tone="onBrand" label="Plus tard" onPress={onDone} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  finish: {
    gap: space[32],
  },
  heading: {
    gap: space[16],
  },
  message: {
    ...text.body,
    fontSize: 18,
    lineHeight: 24,
  },
  frame: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[12],
    overflow: 'hidden',
    borderRadius: radius.xl,
  },
  frameEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.textOnBrandSecondary,
  },
  framePhoto: {
    borderWidth: 2,
    borderColor: color.borderPhoto,
  },
  pressed: {
    opacity: 0.8,
  },
  cameraBadge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
  },
  actions: {
    alignItems: 'center',
    gap: space[24],
  },
});
