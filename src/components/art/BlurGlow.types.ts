import type { ImageSourcePropType } from 'react-native';

export type BlurGlowProps = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  /** Valeur « Layer blur » de Figma (140 sur la fiche, 100 en mode étape par étape). */
  blur: number;
};
