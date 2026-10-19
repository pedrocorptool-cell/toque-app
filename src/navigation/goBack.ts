import { router, type Href } from 'expo-router';

/** Revient à l'écran précédent, ou ouvre `fallback` quand il n'y en a pas (page rechargée, lien direct). */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
