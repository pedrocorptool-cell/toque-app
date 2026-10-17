import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { color, radius, shadow, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button, TextButton } from './Button';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Pied fixe (CTA principal, « Footer de filtre »…). */
  footer?: ReactNode;
};

/** Figma : « Bottom sheet » — poignée, en-tête et contenu. */
export function BottomSheet({ visible, onClose, title, children, footer }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={[styles.sheet, { paddingBottom: space[16] + insets.bottom }]}>
          <View style={styles.grip} />
          {title && (
            <AppText variant="title" style={styles.center}>
              {title}
            </AppText>
          )}
          {children}
          {footer}
        </View>
      </View>
    </Modal>
  );
}

type DialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
};

/** Figma : « Dialogue » — titre, texte et deux actions. */
export function Dialog({ visible, onClose, title, message, confirmLabel, onConfirm, cancelLabel = 'Annuler' }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.dialogRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={styles.dialog} accessibilityRole="alert">
          <View style={styles.dialogHeader}>
            <View style={styles.headerSpacer} />
            <AppText variant="title">{title}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} hitSlop={space[12]}>
              <Icon name="close" />
            </Pressable>
          </View>
          <AppText color={color.textSecondary} style={[styles.center, styles.message]}>
            {message}
          </AppText>
          <View style={styles.dialogActions}>
            <Button label={confirmLabel} onPress={onConfirm} />
            <TextButton label={cancelLabel} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Figma : « Toast » — confirmation éphémère. */
export function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <AppText variant="label" style={styles.toastText}>
        {message}
      </AppText>
      {onClose && (
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} hitSlop={space[12]}>
          <Icon name="close" />
        </Pressable>
      )}
    </View>
  );
}

type FilterFooterProps = {
  onClear: () => void;
  onSubmit: () => void;
  count: number;
};

/** Figma : « Footer de filtre » — Effacer / Voir les résultats (n). */
export function FilterFooter({ onClear, onSubmit, count }: FilterFooterProps) {
  return (
    <View style={styles.filterFooter}>
      <TextButton label="Effacer" onPress={onClear} />
      <Button label={`Voir les résultats (${count})`} onPress={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: color.overlayScrim,
  },
  sheet: {
    gap: space[24],
    padding: space[16],
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
  grip: {
    alignSelf: 'center',
    width: 80,
    height: 6,
    borderRadius: radius.xl,
    backgroundColor: color.actionIconBg,
  },
  dialogRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: space[16],
    backgroundColor: color.overlayScrim,
  },
  dialog: {
    gap: space[24],
    padding: space[16],
    borderRadius: radius.xl,
    backgroundColor: color.bgPage,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 24,
  },
  message: {
    alignSelf: 'center',
    maxWidth: 241,
  },
  dialogActions: {
    alignItems: 'center',
    gap: space[16],
  },
  toast: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    padding: space[12],
    borderRadius: radius.lg,
    backgroundColor: color.aiBg,
    ...shadow.floating,
  },
  toastText: {
    flex: 1,
  },
  filterFooter: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -space[16],
    paddingHorizontal: space[16],
    backgroundColor: color.bgPage,
  },
});
