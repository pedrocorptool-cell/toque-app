import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { Navbar } from '@/components/ui';
import { useProfile } from '@/data/ProfileContext';

export default function TabsLayout() {
  // Premier lancement : la présentation de l'app passe avant les onglets.
  const { onboarded } = useProfile();
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs tabBar={(props) => <Navbar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="liste" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
