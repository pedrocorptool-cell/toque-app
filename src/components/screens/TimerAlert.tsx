import { useEffect, useRef } from 'react';

import { useProfile } from '@/data/ProfileContext';
import { isDone, useTimers } from '@/data/TimersContext';
import { useTimerSound } from '@/data/useTimerSound';

import { TimerSheet } from './TimerSheet';

/**
 * Sheet « Minuteur » montée à la racine de l'app : s'ouvre où que l'on soit dès qu'un minuteur arrive à
 * zéro, avec ceux qui tournent encore en dessous (la même sheet que sur la fiche, à la place du dialogue).
 * La sonnerie choisie dans le profil boucle tant qu'un minuteur terminé n'a pas été arrêté, y compris sur la
 * fiche de la recette.
 */
export function TimerAlert() {
  const { timers, focusedRecipeId, sheetOpen: open, setSheetOpen: setOpen } = useTimers();
  const { timerSound } = useProfile();
  useTimerSound(timerSound, timers.some(isDone) ? 'loop' : 'off');
  // Sur la fiche de la recette concernée, c'est sa sheet qui s'ouvre.
  const doneCount = timers.filter((t) => isDone(t) && t.recipeId !== focusedRecipeId).length;
  const previous = useRef(doneCount);

  useEffect(() => {
    if (doneCount > previous.current) setOpen(true);
    if (doneCount === 0 && previous.current > 0) setOpen(false);
    previous.current = doneCount;
  }, [doneCount, setOpen]);

  // Plus aucun minuteur : la sheet ne doit pas se rouvrir toute seule au prochain lancement.
  const hasTimers = timers.length > 0;
  useEffect(() => {
    if (!hasTimers) setOpen(false);
  }, [hasTimers, setOpen]);

  const sorted = [...timers].sort(
    (a, b) => Number(isDone(b)) - Number(isDone(a)) || a.recipeId.localeCompare(b.recipeId) || a.step - b.step,
  );

  // La sheet arrête elle-même les minuteurs terminés quand on la ferme.
  return <TimerSheet visible={open} onClose={() => setOpen(false)} timers={sorted} />;
}
