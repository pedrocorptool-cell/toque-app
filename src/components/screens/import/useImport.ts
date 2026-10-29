import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { haptics } from '@/data/haptics';
import {
  ImportFailed,
  importedRecipe,
  importRecipe,
  simulatedFailure,
  type ImportFailure,
  type ImportRequest,
} from '@/data/imports';
import type { Recipe } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { supabase } from '@/data/supabase';

import { IMPORT_DURATION } from './ImportLoading';

/** Hors ligne (aperçus web), ou publication sans lien : recette de démo après l'animation. */
function simulate(request: ImportRequest) {
  return new Promise<Recipe>((resolve, reject) =>
    setTimeout(
      () => (simulatedFailure(request) ? reject(new ImportFailed('failed')) : resolve(importedRecipe(request))),
      IMPORT_DURATION,
    ),
  );
}

/**
 * Import d'une recette : l'écran d'attente reste affiché pendant que l'IA lit le lien ou la photo, puis la recette
 * s'ouvre. Renvoie l'import en cours (pour `ImportLoading`) et de quoi le lancer ou l'annuler, puis l'import raté
 * (pour `ImportFailed`), de quoi l'effacer, et la raison de l'échec.
 */
export function useImport() {
  const { addRecipe, categories } = useRecipes();
  const [importing, setImporting] = useState<ImportRequest | null>(null);
  const [failed, setFailed] = useState<ImportRequest | null>(null);
  const [reason, setReason] = useState<ImportFailure>('failed');
  // Lus au moment de l'import, sans relancer l'effet quand la liste change.
  const latest = useRef({ addRecipe, categories });
  latest.current = { addRecipe, categories };

  useEffect(() => {
    if (!importing) return;
    let cancelled = false;
    const real = supabase && !(importing.method === 'social' && !importing.url);
    (real ? importRecipe(importing, latest.current.categories) : simulate(importing))
      .then((recipe) => {
        if (cancelled) return;
        latest.current.addRecipe(recipe);
        haptics.success();
        setImporting(null);
        router.push({ pathname: '/recette/[id]', params: { id: recipe.id, importee: '1' } });
      })
      .catch((error) => {
        if (cancelled) return;
        setReason(error instanceof ImportFailed ? error.reason : 'failed');
        setFailed(importing);
        setImporting(null);
      });
    // « Annuler » vide l'import en cours : le résultat qui arrive ensuite est ignoré.
    return () => {
      cancelled = true;
    };
  }, [importing]);

  return [importing, setImporting, failed, setFailed, reason] as const;
}
