import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { color, radius, space } from '@/theme/tokens';

/** Écran provisoire pour les onglets qui arrivent dans une étape suivante. */
export function ComingSoon({ title, step }: { title: string; step: number }) {
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
    padding: space[16],
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
});
