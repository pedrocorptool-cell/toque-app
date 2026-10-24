import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

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
          const remaining = Math.max(0, t.remaining - 1);
          return { ...t, remaining, running: remaining > 0 };
        }),
      );
    }, 1000);
    return () => clearInterval(tick);
  }, [anyRunning]);

  const value = useMemo<TimersState>(
    () => ({
      timers,
      timerFor: (recipeId, step) => timers.find((t) => t.id === timerId(recipeId, step)),
      toggle: (recipeId, step, duration) =>
        setTimers((list) => {
          const id = timerId(recipeId, step);
          const current = list.find((t) => t.id === id);
          if (!current) return [...list, { id, recipeId, step, duration, remaining: duration, running: true }];
          return list.map((t) =>
            t.id === id ? { ...t, remaining: t.remaining || t.duration, running: !t.running || t.remaining === 0 } : t,
          );
        }),
      reset: (id) => setTimers((list) => list.map((t) => (t.id === id ? { ...t, remaining: t.duration } : t))),
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
