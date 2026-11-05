import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconButton, Logo, Toast, type ToastState } from '@/components/ui';
import { goBack } from '@/navigation/goBack';
import { color, radius, space } from '@/theme/tokens';

type ProfileScreenProps = {
  title: string;
  /** Sous-écran du profil : bouton retour rond à gauche du titre. */
  back?: boolean;
  toast: ToastState;
  children: ReactNode;
};

/** Figma : écrans « Profil » et « Profil/ … » — en-tête brun, feuille claire qui défile. */
export function ProfileScreen({ title, back, toast, children }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  // Pastille des minuteurs par-dessus la feuille : le contenu et le toast lui laissent la place.
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space[24] }]}>
        <View style={styles.topRow}>
          <Logo />
        </View>
        <View style={styles.titleRow}>
          {back && (
            <IconButton icon="chevronLeft" accessibilityLabel="Retour au profil" onPress={() => goBack('/profil')} />
          )}
          <AppText variant="title" color={color.textOnBrandPrimary} accessibilityRole="header">
            {title}
          </AppText>
        </View>
      </View>

      {/* Le clavier remonte la feuille (padding, Android compris : l'app est bord à bord) ; elle défile jusqu'au champ. */}
      <KeyboardAvoidingView style={styles.keyboard} behavior="padding">
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast message={toast.message} onClose={toast.hide} style={styles.toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    gap: space[24],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  // Même hauteur que la ligne de la home (icône du profil de 40 px) : le logo ne bouge pas d'un onglet à l'autre.
  topRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
  content: {
    gap: space[24],
    padding: space[16],
  },
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    bottom: space[16],
  },
});
