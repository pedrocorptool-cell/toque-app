import { useRef } from 'react';

import { TimerList } from '@/components/screens/TimerList';
import { BottomSheet } from '@/components/ui';
import { isDone, useTimers, type Timer } from '@/data/TimersContext';

type TimerSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Minuteurs d'une recette, triés par étape. */
  timers: Timer[];
};

/** Figma : sheet « Minuteur » — les minuteurs lancés d'une recette, pilotables. */
export function TimerSheet({ visible, onClose, timers }: TimerSheetProps) {
  const { remove } = useTimers();
  // Fige les cartes dès la fermeture : la sheet descend telle quelle, sans se redimensionner quand
  // « Arrêter » retire un minuteur juste avant.
  const shown = useRef<Timer[]>([]);
  const closing = useRef(false);
  if (!visible) closing.current = false;
  else if (timers.length && !closing.current) shown.current = timers;

  const close = () => {
    closing.current = true;
    // Comme le dialogue : fermer arrête les minuteurs terminés, les autres continuent.
    timers.filter(isDone).forEach((t) => remove(t.id));
    onClose();
  };

  return (
    <BottomSheet visible={visible && timers.length > 0} onClose={close} title="Minuteur">
      {/* Arrêter un minuteur terminé referme la sheet, les autres minuteurs continuent. */}
      <TimerList timers={shown.current} onStop={close} />
    </BottomSheet>
  );
}
