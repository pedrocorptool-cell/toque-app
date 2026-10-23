import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TimerDock } from '@/components/screens/TimerDock';
import { color } from '@/theme/tokens';

/** Le profil et ses écrans d'option s'empilent sous la barre d'onglets, la pastille des minuteurs en dessous. */
export default function ProfilLayout() {
  return (
    <View style={styles.page}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgBrandPage } }} />
      <TimerDock inline />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
});
