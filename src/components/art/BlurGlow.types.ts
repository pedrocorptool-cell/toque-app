import type { ImageSourcePropType } from 'react-native';

export type BlurGlowProps = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  /** Valeur « Layer blur » de Figma (140 sur la fiche, 100 en mode étape par étape). */
  blur: number;
  /** Laisse aussi le halo déborder en haut et à gauche, quand la photo n'est pas collée au bord de l'écran. */
  bleed?: boolean;
};
