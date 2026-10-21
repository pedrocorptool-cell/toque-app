import { Stack } from 'expo-router';

import { color } from '@/theme/tokens';

/** Le profil et ses écrans d'option s'empilent sous la barre d'onglets. */
export default function ProfilLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgBrandPage } }} />;
}
