import {
  ZalandoSans_300Light,
  ZalandoSans_400Regular,
  ZalandoSans_500Medium,
  useFonts,
} from '@expo-google-fonts/zalando-sans';
import { Kalam_400Regular } from '@expo-google-fonts/kalam';
import { Rubik_900Black } from '@expo-google-fonts/rubik';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { TimerAlert } from '@/components/screens/TimerAlert';
import { RecipesProvider } from '@/data/RecipesContext';
import { TimersProvider } from '@/data/TimersContext';
import { color } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ZalandoSans_300Light,
    ZalandoSans_400Regular,
    ZalandoSans_500Medium,
    Rubik_900Black,
    Kalam_400Regular,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <RecipesProvider>
      <TimersProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgPage } }}>
          {/* Le mode étape par étape s'ouvre par-dessus la fiche, sur fond transparent : il anime lui-même
              la photo et le flou de la fiche jusqu'à leur place (voir pas-a-pas/[id].tsx). */}
          <Stack.Screen
            name="pas-a-pas/[id]"
            options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }}
          />
        </Stack>
        <TimerAlert />
      </TimersProvider>
    </RecipesProvider>
  );
}
