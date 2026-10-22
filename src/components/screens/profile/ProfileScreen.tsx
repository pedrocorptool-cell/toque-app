import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, ChefButton, IconButton, Logo, Toast, type ToastState } from '@/components/ui';
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
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space[24] }]}>
        <View style={styles.topRow}>
          <Logo />
          <ChefButton onPress={() => toast.show('L’offre Toqué Chef arrive bientôt')} />
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

      <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>

      <Toast message={toast.message} onClose={toast.hide} style={styles.toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  header: {
    gap: space[24],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  topRow: {
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
