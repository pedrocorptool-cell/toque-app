import {
  ZalandoSans_300Light,
  ZalandoSans_400Regular,
  ZalandoSans_500Medium,
  useFonts,
} from '@expo-google-fonts/zalando-sans';
import { Kalam_400Regular } from '@expo-google-fonts/kalam';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Stack } from 'expo-router';
import { ShareIntentProvider } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { LaunchSplash } from '@/components/screens/LaunchSplash';
import { TimerAlert } from '@/components/screens/TimerAlert';
import { ProfileProvider } from '@/data/ProfileContext';
import { RecipesProvider } from '@/data/RecipesContext';
import { ShoppingProvider } from '@/data/ShoppingContext';
import { SpaceProvider, useSpace } from '@/data/SpaceContext';
import { TimersProvider } from '@/data/TimersContext';
import { color } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// « Partager vers Toqué » n'existe que dans l'app compilée : ni Expo Go ni le web n'ont le module natif.
const SHARE_DISABLED = Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function RootLayout() {
  return (
    <ShareIntentProvider options={{ disabled: SHARE_DISABLED, resetOnBackground: false }}>
      <SpaceProvider>
        <App />
      </SpaceProvider>
    </ShareIntentProvider>
  );
}

/** L'écran de lancement reste affiché le temps de charger les polices et de retrouver l'espace du téléphone. */
function App() {
  const { ready } = useSpace();
  const [loaded, error] = useFonts({
    ZalandoSans_300Light,
    ZalandoSans_400Regular,
    ZalandoSans_500Medium,
    // Fournie par Pierre ; police « Demo », réservée à un usage perso.
    AvoinDemo_700Bold: require('@/assets/fonts/AvoinDemo-Bold.otf'),
    Kalam_400Regular,
  });

  const done = (loaded || !!error) && ready;

  useEffect(() => {
    if (done) SplashScreen.hideAsync();
  }, [done]);

  // Fond du splash plutôt qu'un écran blanc, au cas où le splash natif disparaît avant (Expo Go).
  if (!done) return <View style={{ flex: 1, backgroundColor: color.bgBrandPage }} />;

  return (
    <ProfileProvider>
      <RecipesProvider>
        <ShoppingProvider>
          <TimersProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bgPage } }}>
              {/* Le mode étape par étape s'ouvre par-dessus la fiche, sur fond transparent : il anime lui-même
                  la photo et le flou de la fiche jusqu'à leur place (voir pas-a-pas/[id].tsx). */}
              <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
              <Stack.Screen
                name="pas-a-pas/[id]"
                options={{
                  presentation: 'transparentModal',
                  animation: 'none',
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              />
            </Stack>
            <TimerAlert />
            <LaunchSplash />
          </TimersProvider>
        </ShoppingProvider>
      </RecipesProvider>
    </ProfileProvider>
  );
}
