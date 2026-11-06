import { useEffect, useMemo } from 'react';
import { Image } from 'react-native';

import {
  cookingNotificationAvailable,
  updateCookingNotification,
  type CookingNotificationEntry,
} from '../../modules/cooking-notification';
import { formatDuration } from '@/components/ui';
import { useCooking } from '@/data/CookingContext';
import { useProfile } from '@/data/ProfileContext';
import type { Recipe } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { isDone, useTimers, type Timer } from '@/data/TimersContext';

/**
 * Figma « Notif Android » : une notification par recette en cours (mode étape par étape), et par recette dont un
 * minuteur a été lancé depuis la fiche. Comme les cards de la home : le minuteur qui sonne le plus tôt, sinon l'étape.
 */
export function CookingNotification() {
  const { cooking } = useCooking();
  const { timers } = useTimers();
  const { recipes } = useRecipes();
  const { timerSound } = useProfile();

  const entries = useMemo(() => {
    if (!cookingNotificationAvailable) return [];
    const list: CookingNotificationEntry[] = [];
    const timerOf = (recipeId: string) =>
      timers.filter((t) => t.recipeId === recipeId).sort((a, b) => order(a) - order(b))[0];
    for (const c of cooking) {
      const recipe = recipes.find((r) => r.id === c.recipeId);
      if (!recipe) continue;
      const total = recipe.steps.length;
      const step = c.step >= total ? 'Photo du plat' : `Étape ${c.step + 1}`;
      list.push(entryOf(recipe, step, `toqueapp://pas-a-pas/${recipe.id}`, timerOf(recipe.id)));
    }
    // Minuteurs lancés depuis la fiche, hors mode étape par étape.
    for (const recipeId of new Set(timers.map((t) => t.recipeId))) {
      if (cooking.some((c) => c.recipeId === recipeId)) continue;
      const recipe = recipes.find((r) => r.id === recipeId);
      const timer = timerOf(recipeId);
      if (!recipe || !timer) continue;
      list.push(entryOf(recipe, `Étape ${timer.step + 1}`, `toqueapp://recette/${recipe.id}`, timer));
    }
    return list;
  }, [cooking, timers, recipes]);

  // Le temps restant change chaque seconde dans l'app ; la notification, elle, ne change qu'avec l'état.
  const key = JSON.stringify(entries);
  useEffect(() => {
    if (cookingNotificationAvailable) updateCookingNotification(JSON.parse(key), timerSound);
  }, [key, timerSound]);

  return null;
}

/** Celui qui sonne d'abord, puis celui qui finit le plus tôt, puis les minuteurs en pause. */
const order = (t: Timer) => (isDone(t) ? -1 : t.running ? t.endsAt! : Number.MAX_SAFE_INTEGER);

function entryOf(recipe: Recipe, step: string, link: string, timer?: Timer): CookingNotificationEntry {
  const entry: CookingNotificationEntry = { id: recipe.id, title: recipe.title, step, link, image: imageOf(recipe) };
  if (!timer) return entry;
  if (isDone(timer)) return { ...entry, ringing: true };
  if (timer.running) return { ...entry, endsAt: timer.endsAt };
  return { ...entry, still: formatDuration(timer.remaining) };
}

function imageOf(recipe: Recipe): string | undefined {
  const source = Array.isArray(recipe.image) ? recipe.image[0] : recipe.image;
  if (typeof source === 'number') return Image.resolveAssetSource(source)?.uri;
  return source?.uri || undefined;
}
