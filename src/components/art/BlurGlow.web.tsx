import { Image, View, type ViewStyle } from 'react-native';

import type { BlurGlowProps } from './BlurGlow.types';

/** Version web : le filtre CSS `blur()` donne le même halo que Skia sur mobile. */
export function BlurGlow({ source, width, height, blur }: BlurGlowProps) {
  // react-native-web transmet le filtre CSS tel quel.
  const filter = { filter: `blur(${blur / 2}px)` } as ViewStyle;
  return (
    <View pointerEvents="none" style={[{ width, height }, filter]}>
      <Image source={source} style={{ width, height }} />
    </View>
  );
}
