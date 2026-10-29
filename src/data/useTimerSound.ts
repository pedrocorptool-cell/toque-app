import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';

import { TIMER_SOUNDS, type TimerSoundId } from './profile';

/** Silence entre deux passages de la sonnerie quand elle boucle. */
const LOOP_GAP = 1500;

// La sonnerie doit s'entendre même téléphone en mode silencieux (iPhone).
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

/**
 * Joue la sonnerie choisie : `once` pour l'aperçu, `loop` pour un minuteur terminé (rejouée après une courte
 * pause tant qu'elle n'est pas arrêtée), `off` la coupe. Changer `take` rejoue le son depuis le début.
 */
export function useTimerSound(id: TimerSoundId, mode: 'off' | 'once' | 'loop', onEnd?: () => void, take = 0) {
  const player = useAudioPlayer(TIMER_SOUNDS.find((s) => s.id === id)!.file);
  const latestEnd = useRef(onEnd);
  latestEnd.current = onEnd;

  useEffect(() => {
    if (mode === 'off') return;
    let gap: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      player.seekTo(0).catch(() => {});
      player.play();
    };
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return;
      if (mode === 'loop') {
        clearTimeout(gap);
        gap = setTimeout(start, LOOP_GAP);
      } else latestEnd.current?.();
    });
    start();
    return () => {
      clearTimeout(gap);
      sub.remove();
      player.pause();
    };
  }, [player, mode, take]);
}
