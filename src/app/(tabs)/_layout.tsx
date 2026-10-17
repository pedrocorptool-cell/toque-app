import { Tabs } from 'expo-router/js-tabs';

import { Navbar } from '@/components/ui';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <Navbar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="liste" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
