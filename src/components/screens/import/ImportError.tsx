import { Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, TextButton } from '@/components/ui';
import type { ImportFailure } from '@/data/imports';
import { color, font, space } from '@/theme/tokens';

const ILLUS = require('@/assets/images/illus/missing-recipe.png');

type ImportErrorProps = {
  visible: boolean;
  onRetry: () => void;
  onClose: () => void;
  reason?: ImportFailure;
};

const MESSAGES: Record<ImportFailure, string> = {
  unreachable: 'Vérifie ta connexion et que le lien mène bien à une recette, puis réessaie.',
  failed: 'Vérifie ta connexion et que le lien mène bien à une recette, puis réessaie.',
  not_a_recipe: 'Toqué n’a pas trouvé de recette ici. Essaie avec un autre lien ou une autre photo.',
  // En attendant l'écran dédié de Pierre.
  no_credits: 'Les crédits IA sont épuisés. Recharge-les sur la console Anthropic, puis réessaie.',
};

/** Figma « Import/ Erreur » (741:617) : même mise en page que « Recette introuvable », avec « Réessayer ». */
export function ImportError({ visible, onRetry, onClose, reason = 'failed' }: ImportErrorProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Image source={ILLUS} style={styles.illus} accessibilityIgnoresInvertColors />
        <AppText color={color.textOnBrandPrimary} style={styles.title} accessibilityRole="header">
          Import impossible
        </AppText>
        <AppText color={color.textOnBrandSecondary} style={styles.message}>
          {MESSAGES[reason]}
        </AppText>
        <Button variant="secondary" label="Réessayer" onPress={onRetry} />
        <TextButton tone="onBrand" label="Retour" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[16],
    paddingHorizontal: space[16],
    backgroundColor: color.bgBrandPage,
  },
  // Image exportée avec ses ombres (413 × 357) : marges négatives pour garder la boîte Figma de 361 × 322.
  illus: {
    width: 413,
    height: 357,
    marginVertical: -18,
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
