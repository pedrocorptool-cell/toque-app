import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { ProfileScreen } from '@/components/screens/profile/ProfileScreen';
import { ListCard, ListRow, Radio, useToast } from '@/components/ui';
import { TIMER_SOUNDS, type TimerSoundId } from '@/data/profile';
import { useProfile } from '@/data/ProfileContext';
import { color } from '@/theme/tokens';

/** Durée de l'aperçu : le prototype n'embarque pas les sons, l'onde montre seulement qu'il joue. */
const PREVIEW = 2400;
const EASE = Easing.inOut(Easing.quad);

/** Figma : « Profil/ Sonneries » et « Profil/ Sonneries playing » — son joué à la fin d'un minuteur. */
export default function SonsScreen() {
  const { timerSound, setTimerSound } = useProfile();
  const toast = useToast();
  const [playing, setPlaying] = useState<TimerSoundId | null>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setPlaying(null), PREVIEW);
    return () => clearTimeout(id);
  }, [playing]);

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
                setPlaying(sound.id);
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
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.35, duration: 400, easing: EASE, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 400, easing: EASE, useNativeDriver: true }),
        ]),
      );
      loop.start();
    }, () => {});
    return () => loop?.stop();
  }, [pulse]);

  return (
    <Animated.View style={{ opacity: pulse }}>
      <Icon name="waveform" color={color.actionPrimaryBg} />
    </Animated.View>
  );
}
