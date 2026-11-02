import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useTimers } from './TimersContext';

/**
 * Recette en cours : lancée en mode étape par étape et pas encore terminée. Un minuteur lancé depuis la fiche ne
 * compte pas (on n'y connaît ni l'étape ni la fin de la recette).
 */
export type Cooking = {
  recipeId: string;
  /** Étape affichée (0 pour la 1re ; le nombre d'étapes pour l'écran de fin, la photo du plat). */
  step: number;
  /** Parts choisies sur la fiche, pour les quantités des étapes à la reprise. */
  parts?: number;
  /** Dernière activité, pour l'ordre des cards et le nettoyage. */
  updatedAt: number;
};

type CookingState = {
  cooking: Cooking[];
  cookingOf: (recipeId: string) => Cooking | undefined;
  /** Mode étape par étape ouvert ou étape changée : la recette est (ou reste) en cours. */
  track: (recipeId: string, step: number, parts?: number) => void;
  /** Croix de la card ou « Terminer » : la recette n'est plus en cours, ses minuteurs s'arrêtent. */
  end: (recipeId: string) => void;
};

const STORAGE_KEY = 'toque.cooking';
/** Sans activité ni minuteur depuis 24 h, une recette en cours disparaît : pas de card oubliée sur la home. */
const EXPIRY = 24 * 60 * 60 * 1000;

const CookingContext = createContext<CookingState | null>(null);

/** Propre à chaque téléphone : ce que cuisine l'un ne s'affiche pas chez les autres membres de l'espace. */
export function CookingProvider({ children }: { children: ReactNode }) {
  const { timers, remove } = useTimers();
  const [cooking, setCooking] = useState<Cooking[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const saved: Cooking[] = raw ? JSON.parse(raw) : [];
        setCooking(saved.filter((c) => Date.now() - c.updatedAt < EXPIRY));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cooking)).catch(() => {});
  }, [cooking, loaded]);

  // Un minuteur qui tourne garde la recette active : elle n'expire qu'une fois les minuteurs arrêtés.
  const timerRecipes = useMemo(() => new Set(timers.map((t) => t.recipeId)), [timers]);
  useEffect(() => {
    const check = () =>
      setCooking((list) => {
        const kept = list.filter((c) => timerRecipes.has(c.recipeId) || Date.now() - c.updatedAt < EXPIRY);
        return kept.length === list.length ? list : kept;
      });
    check();
    const every = setInterval(check, 60 * 1000);
    return () => clearInterval(every);
  }, [timerRecipes]);

  const value = useMemo<CookingState>(
    () => ({
      cooking,
      cookingOf: (recipeId) => cooking.find((c) => c.recipeId === recipeId),
      track: (recipeId, step, parts) =>
        setCooking((list) => [
          { recipeId, step, parts: parts ?? list.find((c) => c.recipeId === recipeId)?.parts, updatedAt: Date.now() },
          ...list.filter((c) => c.recipeId !== recipeId),
        ]),
      end: (recipeId) => {
        setCooking((list) => list.filter((c) => c.recipeId !== recipeId));
        timers.filter((t) => t.recipeId === recipeId).forEach((t) => remove(t.id));
      },
    }),
    [cooking, timers, remove],
  );

  return <CookingContext.Provider value={value}>{children}</CookingContext.Provider>;
}

export function useCooking() {
  const state = useContext(CookingContext);
  if (!state) throw new Error('useCooking doit être utilisé sous <CookingProvider>');
  return state;
}
