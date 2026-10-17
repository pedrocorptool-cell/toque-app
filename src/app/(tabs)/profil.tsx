import { router } from 'expo-router';

import { ComingSoon } from '@/components/screens/ComingSoon';
import { TextButton } from '@/components/ui';

export default function ProfilScreen() {
  return (
    <ComingSoon title="Profil" step={2}>
      <TextButton label="Voir le design system" onPress={() => router.push('/design-system')} />
    </ComingSoon>
  );
}
