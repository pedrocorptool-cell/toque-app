import {
  ZalandoSans_300Light,
  ZalandoSans_400Regular,
  ZalandoSans_500Medium,
  useFonts,
} from '@expo-google-fonts/zalando-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { color } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ ZalandoSans_300Light, ZalandoSans_400Regular, ZalandoSans_500Medium });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgPage } }} />
    </>
  );
}
