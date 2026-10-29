import { Blur, Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';

import type { BlurGlowProps } from './BlurGlow.types';

/**
 * Photo floutée comme un « Layer blur » Figma : le flou déborde du cadre et ses bords se dissolvent
 * dans le fond, sans fondu de couleur. `blur` est la valeur saisie dans Figma.
 */
export function BlurGlow({ source, width, height, blur, bleed }: BlurGlowProps) {
  // Photo du projet (`require`) ou photo prise par l'utilisateur (`{ uri }`).
  const image = useImage(typeof source === 'number' ? source : (source as { uri: string }).uri);
  // Figma affiche le double de l'écart-type (« blur 140 » = flou CSS de 70 px).
  const sigma = blur / 2;
  // Le canevas déborde à droite et en bas pour ne pas couper le halo ; avec `bleed`, aussi en haut et à gauche,
  // la photo gardant sa place grâce aux marges négatives.
  const spread = sigma * 2;
  const before = bleed ? spread : 0;
  return (
    <Canvas
      style={{
        width: width + spread + before,
        height: height + spread + before,
        margin: -before,
        marginRight: 0,
        marginBottom: 0,
      }}
      pointerEvents="none">
      {image && (
        <SkiaImage image={image} x={before} y={before} width={width} height={height} fit="cover">
          <Blur blur={sigma} mode="decal" />
        </SkiaImage>
      )}
    </Canvas>
  );
}
