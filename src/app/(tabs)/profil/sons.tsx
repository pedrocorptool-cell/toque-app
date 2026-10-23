import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { ProfileScreen } from '@/components/screens/profile/ProfileScreen';
import { ListCard, ListRow, Radio, useToast } from '@/components/ui';
import { TIMER_SOUNDS, type TimerSoundId } from '@/data/profile';
import { useProfile } from '@/data/ProfileContext';
import { useTimerSound } from '@/data/useTimerSound';
import { color } from '@/theme/tokens';

const EASE = Easing.inOut(Easing.quad);

/** Figma : « Profil/ Sonneries » et « Profil/ Sonneries playing » — son joué à la fin d'un minuteur, avec aperçu. */
export default function SonsScreen() {
  const { timerSound, setTimerSound } = useProfile();
  const toast = useToast();
  // Aperçu en cours ; `take` relance le son quand on touche à nouveau la même ligne.
  const [preview, setPreview] = useState<{ id: TimerSoundId; take: number } | null>(null);
  const playing = preview?.id ?? null;
  useTimerSound(preview?.id ?? timerSound, preview ? 'once' : 'off', () => setPreview(null), preview?.take);

  return (
    <ProfileScreen title="Son des minuteurs" back toast={toast}>
      <ListCard>
        {TIMER_SOUNDS.map((sound) => {
          const selected = sound.id === timerSound;
          return (
            <ListRow
              key={sound.id}
              label={sound.label}
              accessibilityRole="radio"
              accessibilityLabel={playing === sound.id ? `${sound.label}, aperçu en cours` : sound.label}
              selected={selected}
              inline={playing === sound.id ? <Wave /> : undefined}
              trailing={<Radio selected={selected} />}
              onPress={() => {
                setTimerSound(sound.id);
                setPreview((p) => ({ id: sound.id, take: (p?.take ?? 0) + 1 }));
              }}
            />
          );
        })}
      </ListCard>
    </ProfileScreen>
  );
}

/** Onde orange qui pulse pendant l'aperçu, fixe avec « Réduire les animations ». */
function Wave() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (reduce) => {
        if (reduce) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 0.35, duration: 400, easing: EASE, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1, duration: 400, easing: EASE, useNativeDriver: true }),
          ]),
        );
        loop.start();
      },
      () => {},
    );
    return () => loop?.stop();
  }, [pulse]);

  return (
    <Animated.View style={{ opacity: pulse }}>
      <Icon name="waveform" color={color.actionPrimaryBg} />
    </Animated.View>
  );
}
