import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { color, radius, space } from '@/theme/tokens';

/** Écran provisoire pour les onglets qui arrivent dans une étape suivante. */
export function ComingSoon({ title, step, children }: { title: string; step: number; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space[24] }]}>
        <AppText variant="title" color={color.textOnBrandPrimary}>
          {title}
        </AppText>
      </View>
      <View style={styles.content}>
        <AppText color={color.textSecondary}>{`Cet écran arrive à l’étape ${step}.`}</AppText>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  header: {
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
    gap: space[16],
    padding: space[16],
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
});
