import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
  /** Sous-écran (« Créer une catégorie ») : flèche retour à gauche du titre, croix à droite, sans poignée. */
  onBack?: () => void;
};

const SHEET_DURATION = 250;

type SheetModalProps = {
  visible: boolean;
  onClose: () => void;
  sheetStyle: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Socle des bottom sheets : le voile apparaît en fondu sur place, seule la feuille glisse depuis le bas.
 * La fenêtre reste montée le temps de l'animation de fermeture.
 */
function SheetModal({ visible, onClose, sheetStyle, children }: SheetModalProps) {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const [height, setHeight] = useState(800);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: SHEET_DURATION,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetRoot}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        </Animated.View>
        <Animated.View
          onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
          style={[styles.sheet, sheetStyle, { transform: [{ translateY }] }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Figma : « Bottom sheet » — poignée, en-tête et contenu. */
export function BottomSheet({ visible, onClose, title, children, footer, onBack }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <SheetModal visible={visible} onClose={onClose} sheetStyle={{ paddingBottom: space[16] + insets.bottom }}>
      {onBack ? (
        <View style={styles.dialogHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack} hitSlop={space[12]}>
            <Icon name="arrowLeft" />
          </Pressable>
          <AppText variant="title">{title}</AppText>
          <CloseButton onPress={onClose} />
        </View>
      ) : (
        <>
          <View style={styles.grip} />
          {title && (
            <AppText variant="title" style={styles.center}>
              {title}
            </AppText>
          )}
        </>
      )}
      {children}
      {footer}
    </SheetModal>
  );
}

type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Contenu fixe au-dessus de la liste (champ de recherche du filtre Créateur). */
  header?: ReactNode;
  children: ReactNode;
  onClear: () => void;
  onSubmit: () => void;
  count: number;
};

/** Figma : écrans « Filtre/ … » — titre à gauche, croix, liste d'options et « Footer de filtre ». */
export function FilterSheet({ visible, onClose, title, header, children, onClear, onSubmit, count }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <SheetModal visible={visible} onClose={onClose} sheetStyle={[styles.filterSheet, { paddingBottom: insets.bottom }]}>
      <View style={styles.filterHeader}>
        <AppText variant="title">{title}</AppText>
        <CloseButton onPress={onClose} />
      </View>
      {header}
      <ScrollView style={styles.filterBody} bounces={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      <FilterFooter onClear={onClear} onSubmit={onSubmit} count={count} />
    </SheetModal>
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

type DialogFrameProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/** Cadre commun des dialogues : voile, carte centrée, titre et croix de fermeture. */
export function DialogFrame({ visible, onClose, title, children }: DialogFrameProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.dialogRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
        <View style={styles.dialog} accessibilityRole="alert">
          <View style={styles.dialogHeader}>
            <View style={styles.headerSpacer} />
            <AppText variant="title">{title}</AppText>
            <CloseButton onPress={onClose} />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** Figma : « Dialogue » — titre, texte et deux actions. */
export function Dialog({ visible, onClose, title, message, confirmLabel, onConfirm, cancelLabel = 'Annuler' }: DialogProps) {
  return (
    <DialogFrame visible={visible} onClose={onClose} title={title}>
      <AppText color={color.textSecondary} style={[styles.center, styles.message]}>
        {message}
      </AppText>
      <View style={styles.dialogActions}>
        <Button label={confirmLabel} onPress={onConfirm} />
        <TextButton label={cancelLabel} onPress={onClose} />
      </View>
    </DialogFrame>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onPress} hitSlop={space[12]}>
      <Icon name="close" />
    </Pressable>
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
  },
  scrim: {
    backgroundColor: color.overlayScrim,
  },
  sheet: {
    gap: space[24],
    padding: space[16],
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
  filterSheet: {
    maxHeight: '85%',
    paddingBottom: 0,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterBody: {
    flexGrow: 0,
    marginBottom: -space[24],
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
