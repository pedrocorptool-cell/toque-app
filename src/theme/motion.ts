import { Easing } from 'react-native';

/** Courbes et durées des animations d'interface (skill « find-animation-opportunities »). */
export const motion = {
  /** Sortie rapide puis freinage doux : entrées d'éléments. */
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  /** Démarrage doux : sorties d'éléments. */
  easeIn: Easing.bezier(0.32, 0, 0.67, 0),
} as const;
