import { Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, TextButton } from '@/components/ui';
import type { ImportFailure } from '@/data/imports';
import { color, font, space } from '@/theme/tokens';

const MISSING = require('@/assets/images/illus/missing-recipe.png');
const NO_CREDITS = require('@/assets/images/illus/no-credits.png');

type ImportErrorProps = {
  visible: boolean;
  onRetry: () => void;
  onClose: () => void;
  reason?: ImportFailure;
};

const GENERIC = 'Vérifie ta connexion et que le lien mène bien à une recette, puis réessaie.';
const MESSAGES: Record<ImportFailure, { title: string; message: string }> = {
  unreachable: { title: 'Import impossible', message: GENERIC },
  failed: { title: 'Import impossible', message: GENERIC },
  not_a_recipe: {
    title: 'Import impossible',
    message: 'Toqué n’a pas trouvé de recette ici. Essaie avec un autre lien ou une autre photo.',
  },
  // Figma 775:7997.
  no_credits: {
    title: 'Crédits insuffisants',
    message: 'Recharge ton compte Claude en crédits pour importer cette recette.',
  },
};

/**
 * Figma « Import/ Erreur » (741:617, et 775:7997 pour les crédits épuisés) : illustration, texte et boutons
 * espacés de 40 px, comme « Recette introuvable ».
 */
export function ImportError({ visible, onRetry, onClose, reason = 'failed' }: ImportErrorProps) {
  const insets = useSafeAreaInsets();
  const { title, message } = MESSAGES[reason];
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {reason === 'no_credits' ? (
          <Image source={NO_CREDITS} style={styles.credits} accessibilityIgnoresInvertColors />
        ) : (
          <Image source={MISSING} style={styles.illus} accessibilityIgnoresInvertColors />
        )}
        <View style={styles.text}>
          <AppText color={color.textOnBrandPrimary} style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
          <AppText color={color.textOnBrandSecondary} style={styles.message}>
            {message}
          </AppText>
        </View>
        <View style={styles.actions}>
          <Button variant="secondary" label="Réessayer" onPress={onRetry} />
          <TextButton tone="onBrand" label="Retour" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[40],
    paddingHorizontal: space[16],
    backgroundColor: color.bgBrandPage,
  },
  // Image exportée avec ses ombres (413 × 357) : marges négatives pour garder la boîte Figma de 361 × 322.
  illus: {
    width: 413,
    height: 357,
    marginVertical: -18,
  },
  credits: {
    width: 361,
    height: 369,
  },
  text: {
    alignItems: 'center',
    gap: space[16],
  },
  actions: {
    alignItems: 'center',
    gap: space[24],
  },
  title: {
    fontFamily: font.medium,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  message: {
    maxWidth: 329,
    lineHeight: 24,
    textAlign: 'center',
  },
});
