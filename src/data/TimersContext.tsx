import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useProfile } from './ProfileContext';
import { useRecipes } from './RecipesContext';
import { cancelTimerEnd, scheduleTimerEnd } from './timerNotifications';

/** Minuteur d'une étape. Il continue de tourner quand on quitte la fiche recette. */
export type Timer = {
  id: string;
  recipeId: string;
  /** Index de l'étape (0 pour l'étape 1). */
  step: number;
  /** Durée de départ, en secondes. */
  duration: number;
  remaining: number;
  running: boolean;
  /** Heure de fin quand il tourne : le temps restant en est déduit, même après un passage en arrière-plan. */
  endsAt?: number;
};

type TimersState = {
  timers: Timer[];
  timerFor: (recipeId: string, step: number) => Timer | undefined;
  /** Lance un minuteur absent, sinon le met en pause ou le relance. */
  toggle: (recipeId: string, step: number, duration: number) => void;
  /** Repart de la durée de départ, sans changer lecture / pause. */
  reset: (id: string) => void;
  remove: (id: string) => void;
  /** Fiche recette à l'écran : ses minuteurs terminés s'affichent dans sa sheet, pas dans le dialogue. */
  focusedRecipeId: string | null;
  setFocusedRecipeId: (id: string | null) => void;
  /** Sheet « Minuteur » hors fiche recette : ouverte par la pastille ou quand un minuteur sonne. */
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
};

const TimersContext = createContext<TimersState | null>(null);

const timerId = (recipeId: string, step: number) => `${recipeId}:${step}`;

export function TimersProvider({ children }: { children: ReactNode }) {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [focusedRecipeId, setFocusedRecipeId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const anyRunning = timers.some((t) => t.running);
  useEffect(() => {
    if (!anyRunning) return;
    const tick = setInterval(() => {
      setTimers((list) =>
        list.map((t) => {
          if (!t.running) return t;
          const remaining = Math.max(0, Math.round((t.endsAt! - Date.now()) / 1000));
          return { ...t, remaining, running: remaining > 0, endsAt: remaining > 0 ? t.endsAt : undefined };
        }),
      );
    }, 1000);
    return () => clearInterval(tick);
  }, [anyRunning]);

  // Une notification par minuteur qui tourne, reprogrammée à chaque départ, annulée à la pause ou à la suppression.
  const { recipes } = useRecipes();
  const { timerSound } = useProfile();
  const scheduled = useRef(new Map<string, number>());
  useEffect(() => {
    const running = new Map(timers.filter((t) => t.endsAt).map((t) => [t.id, t]));
    for (const id of scheduled.current.keys()) {
      if (!running.has(id)) {
        cancelTimerEnd(id);
        scheduled.current.delete(id);
      }
    }
    for (const t of running.values()) {
      if (scheduled.current.get(t.id) === t.endsAt) continue;
      scheduled.current.set(t.id, t.endsAt!);
      const recipe = recipes.find((r) => r.id === t.recipeId);
      const body = `${recipe?.title ?? 'Recette'} · étape ${t.step + 1}`;
      scheduleTimerEnd(t.id, Math.round((t.endsAt! - Date.now()) / 1000), body, timerSound);
    }
  }, [timers, recipes, timerSound]);

  const value = useMemo<TimersState>(
    () => ({
      timers,
      timerFor: (recipeId, step) => timers.find((t) => t.id === timerId(recipeId, step)),
      toggle: (recipeId, step, duration) =>
        setTimers((list) => {
          const id = timerId(recipeId, step);
          const current = list.find((t) => t.id === id);
          const now = Date.now();
          if (!current)
            return [
              ...list,
              { id, recipeId, step, duration, remaining: duration, running: true, endsAt: now + duration * 1000 },
            ];
          return list.map((t) => {
            if (t.id !== id) return t;
            const remaining = t.remaining || t.duration;
            const running = !t.running || t.remaining === 0;
            return { ...t, remaining, running, endsAt: running ? now + remaining * 1000 : undefined };
          });
        }),
      reset: (id) =>
        setTimers((list) =>
          list.map((t) =>
            t.id === id
              ? { ...t, remaining: t.duration, endsAt: t.running ? Date.now() + t.duration * 1000 : undefined }
              : t,
          ),
        ),
      remove: (id) => setTimers((list) => list.filter((t) => t.id !== id)),
      focusedRecipeId,
      setFocusedRecipeId,
      sheetOpen,
      setSheetOpen,
    }),
    [timers, focusedRecipeId, sheetOpen],
  );

  return <TimersContext.Provider value={value}>{children}</TimersContext.Provider>;
}

export function useTimers() {
  const state = useContext(TimersContext);
  if (!state) throw new Error('useTimers doit être utilisé sous <TimersProvider>');
  return state;
}

/** Un minuteur arrivé à zéro attend qu'on l'arrête. */
export const isDone = (t: Timer) => t.remaining === 0;

/**
 * Minuteurs de toutes les recettes pour une sheet : ceux de la recette à l'écran d'abord, puis les autres
 * regroupés par recette, chaque groupe dans l'ordre des étapes.
 */
export const orderTimers = (timers: Timer[], firstRecipeId?: string | null) =>
  [...timers].sort(
    (a, b) =>
      Number(b.recipeId === firstRecipeId) - Number(a.recipeId === firstRecipeId) ||
      a.recipeId.localeCompare(b.recipeId) ||
      a.step - b.step,
  );
