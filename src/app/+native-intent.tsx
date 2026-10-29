import { getShareExtensionKey } from 'expo-share-intent';

/**
 * Lien partagé depuis une autre app (« Partager vers Toqué ») : le module ouvre l'app avec une adresse technique,
 * renvoyée vers l'accueil, qui lance l'import.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) return '/';
    return path;
  } catch {
    return '/';
  }
}
