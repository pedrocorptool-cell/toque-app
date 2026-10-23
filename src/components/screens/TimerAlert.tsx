import { useEffect, useRef, useState } from 'react';

import { DialogFrame } from '@/components/ui';
import { useProfile } from '@/data/ProfileContext';
import { isDone, useTimers } from '@/data/TimersContext';
import { useTimerSound } from '@/data/useTimerSound';

import { TimerList } from './TimerList';

/**
 * Figma : « Dialogue/ Minuteur ». Monté à la racine de l'app : s'ouvre où que l'on soit
 * dès qu'un minuteur arrive à zéro, avec ceux qui tournent encore en dessous. La sonnerie choisie dans le
 * profil boucle tant qu'un minuteur terminé n'a pas été arrêté, y compris sur la fiche de la recette.
 */
export function TimerAlert() {
  const { timers, remove, focusedRecipeId } = useTimers();
  const { timerSound } = useProfile();
  useTimerSound(timerSound, timers.some(isDone) ? 'loop' : 'off');
  const [open, setOpen] = useState(false);
  // Sur la fiche de la recette concernée, c'est sa sheet qui s'ouvre.
  const doneCount = timers.filter((t) => isDone(t) && t.recipeId !== focusedRecipeId).length;
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
  // Garde la liste affichée pendant le fondu de fermeture.
  const shown = useRef(sorted);
  if (open) shown.current = sorted;

  return (
    <DialogFrame visible={open} onClose={close} title="Minuteurs">
      <TimerList timers={shown.current} />
    </DialogFrame>
  );
}
