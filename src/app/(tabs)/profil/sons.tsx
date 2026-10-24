import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

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

/**
 * Barres de l'icône « waveform » (24 × 24) : centre x, hauteur au repos, et rythme de leur va-et-vient.
 * Chaque barre grandit et rapetisse depuis son centre, à sa propre vitesse, comme un égaliseur.
 */
const BARS = [
  { x: 4.5, height: 6, duration: 520 },
  { x: 8.25, height: 18, duration: 380 },
  { x: 12, height: 12, duration: 460 },
  { x: 15.75, height: 6, duration: 340 },
  { x: 19.5, height: 9, duration: 600 },
];
const BAR_WIDTH = 1.5;
const WAVE_SIZE = 24;

/** Onde orange de l'aperçu : ses barres s'animent pendant la lecture, fixes avec « Réduire les animations ». */
function Wave() {
  const scales = useRef(BARS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    let loops: Animated.CompositeAnimation[] = [];
    AccessibilityInfo.isReduceMotionEnabled().then(
      (reduce) => {
        if (reduce) return;
        loops = scales.map((scale, i) =>
          Animated.loop(
            Animated.sequence([
              Animated.timing(scale, { toValue: 0.3, duration: BARS[i].duration, easing: EASE, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1, duration: BARS[i].duration, easing: EASE, useNativeDriver: true }),
            ]),
          ),
        );
        loops.forEach((loop) => loop.start());
      },
      () => {},
    );
    return () => loops.forEach((loop) => loop.stop());
  }, [scales]);

  return (
    <View style={styles.wave}>
      {BARS.map((bar, i) => (
        <Animated.View
          key={bar.x}
          style={[
            styles.bar,
            {
              left: bar.x - BAR_WIDTH / 2,
              top: (WAVE_SIZE - bar.height) / 2,
              height: bar.height,
              transform: [{ scaleY: scales[i] }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    width: WAVE_SIZE,
    height: WAVE_SIZE,
  },
  bar: {
    position: 'absolute',
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    backgroundColor: color.actionPrimaryBg,
  },
});
