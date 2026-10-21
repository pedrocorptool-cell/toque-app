import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { importedRecipe, type ImportRequest } from '@/data/imports';
import { useRecipes } from '@/data/RecipesContext';

import { IMPORT_DURATION } from './ImportLoading';

/**
 * Import simulé : l'écran d'attente reste le temps de voir l'animation, puis la recette s'ouvre.
 * Renvoie l'import en cours (pour `ImportLoading`) et de quoi le lancer ou l'annuler.
 */
export function useSimulatedImport() {
  const { addRecipe } = useRecipes();
  const [importing, setImporting] = useState<ImportRequest | null>(null);

  useEffect(() => {
    if (!importing) return;
    const id = setTimeout(() => {
      const recipe = importedRecipe(importing);
      addRecipe(recipe);
      setImporting(null);
      router.push({ pathname: '/recette/[id]', params: { id: recipe.id, importee: '1' } });
    }, IMPORT_DURATION);
    return () => clearTimeout(id);
  }, [importing, addRecipe]);

  return [importing, setImporting] as const;
}
