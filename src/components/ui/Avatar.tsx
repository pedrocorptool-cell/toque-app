import { Image, StyleSheet, View } from 'react-native';

import { AVATARS, type Avatar as AvatarValue } from '@/data/profile';

/** Part de l'illustration dans son image : l'export garde une large marge transparente pour l'ombre portée. */
export const AVATAR_FILL = 192 / 360;
/** Image d'un avatar Toqué par rapport à son rond : un cadre de 120 px dans le rond de 160 px (Figma « Avatar »). */
export const AVATAR_ART_RATIO = 0.75 / AVATAR_FILL;

/** Figma : « Avatar » — illustration Toqué sur un fond de couleur, ou photo de l'utilisateur. */
export function Avatar({ avatar, size }: { avatar: AvatarValue; size: number }) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (avatar.kind === 'photo') {
    return <Image source={{ uri: avatar.uri }} style={round} accessibilityIgnoresInvertColors />;
  }
  const art = size * AVATAR_ART_RATIO;
  return (
    <View style={[styles.round, round, { backgroundColor: avatar.background }]}>
      <Image source={AVATARS.find((a) => a.id === avatar.id)!.image} style={{ width: art, height: art }} />
    </View>
  );
}

const styles = StyleSheet.create({
  round: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
