import { useEffect, useRef, useState } from 'react';

import { DialogFrame } from '@/components/ui';
import { isDone, useTimers } from '@/data/TimersContext';

import { TimerList } from './TimerList';

/**
 * Figma : « Dialogue/ Minuteur ». Monté à la racine de l'app : s'ouvre où que l'on soit
 * dès qu'un minuteur arrive à zéro, avec ceux qui tournent encore en dessous.
 */
export function TimerAlert() {
  const { timers, remove } = useTimers();
  const [open, setOpen] = useState(false);
  const doneCount = timers.filter(isDone).length;
  const previous = useRef(doneCount);

  useEffect(() => {
    if (doneCount > previous.current) setOpen(true);
    if (doneCount === 0) setOpen(false);
    previous.current = doneCount;
  }, [doneCount]);

  const close = () => {
    // Fermer vaut « Arrêter » pour les minuteurs terminés ; les autres continuent.
    timers.filter(isDone).forEach((t) => remove(t.id));
    setOpen(false);
  };

  const sorted = [...timers].sort((a, b) => Number(isDone(b)) - Number(isDone(a)) || a.step - b.step);

  return (
    <DialogFrame visible={open} onClose={close} title="Minuteurs">
      <TimerList timers={sorted} />
    </DialogFrame>
  );
}
