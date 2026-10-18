import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { DEMO_QR_PATH } from '@/components/art/paths';
import { Icon } from '@/components/icons/Icon';
import { AppText, DialogFrame } from '@/components/ui';
import { color, radius, space } from '@/theme/tokens';

type ShareDialogProps = {
  visible: boolean;
  onClose: () => void;
  onCopyLink: () => void;
};

/** Figma : dialogue « Partager » — QR code d'import et copie du lien. */
export function ShareDialog({ visible, onClose, onCopyLink }: ShareDialogProps) {
  return (
    <DialogFrame visible={visible} onClose={onClose} title="Partager">
      <AppText color={color.textSecondary} style={styles.message}>
        Scanne le QR code ci-dessous pour importer cette recette dans ton espace Toqué !
      </AppText>
      <View style={styles.qr}>
        <Svg width={160} height={160} viewBox="0 0 160 160">
          <Path d={DEMO_QR_PATH} fill={color.textPrimary} />
        </Svg>
        <View style={styles.qrCenter} />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onCopyLink}
        hitSlop={space[8]}
        style={({ pressed }) => [styles.copy, pressed && styles.pressed]}>
        <Icon name="link" color={color.actionSecondaryIcon} />
        <AppText variant="button">Copier le lien</AppText>
      </Pressable>
    </DialogFrame>
  );
}

const styles = StyleSheet.create({
  message: {
    alignSelf: 'center',
    maxWidth: 280,
    textAlign: 'center',
  },
  qr: {
    alignSelf: 'center',
    width: 192,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  qrCenter: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: color.aiBg,
  },
  copy: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: space[8],
  },
  pressed: {
    opacity: 0.6,
  },
});
