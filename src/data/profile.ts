import type { ImageSourcePropType } from 'react-native';

import { color } from '@/theme/tokens';

export type AvatarId = 'onion' | 'tomato' | 'olive' | 'biscuit';

/** Figma « 🚀 Design » (avatars à côté de l'onboarding), dans l'ordre du carrousel, qui boucle. */
export const AVATARS: { id: AvatarId; label: string; image: ImageSourcePropType }[] = [
  { id: 'onion', label: 'Oignon', image: require('@/assets/images/avatars/onion.png') },
  { id: 'tomato', label: 'Tomate', image: require('@/assets/images/avatars/tomato.png') },
  { id: 'olive', label: 'Olive', image: require('@/assets/images/avatars/olive.png') },
  { id: 'biscuit', label: 'Biscuit', image: require('@/assets/images/avatars/biscuit.png') },
];

/** Couleurs de fond proposées sous le carrousel. */
export const AVATAR_BACKGROUNDS = [color.accentBlue, color.accentCreme, color.accentLime, color.accentPink];

export type Avatar = { kind: 'toque'; id: AvatarId; background: string } | { kind: 'photo'; uri: string };

export type TimerSoundId = 'timer' | 'den-den' | 'ultra-instinct' | 'outro';

/** Figma « Profil/ Sonneries » (536:7644), fichiers fournis par Pierre dans `assets/sounds`. */
export const TIMER_SOUNDS: { id: TimerSoundId; label: string; file: number }[] = [
  { id: 'timer', label: 'Timer', file: require('@/assets/sounds/timer.mp3') },
  { id: 'den-den', label: 'Den-Den', file: require('@/assets/sounds/den-den.mp3') },
  { id: 'ultra-instinct', label: 'Ultra Instinct', file: require('@/assets/sounds/ultra-instinct.mp3') },
  { id: 'outro', label: 'Outro', file: require('@/assets/sounds/outro.mp3') },
];

/** Figma « Profil/ Parts » : choix proposés avant « Personnaliser ». */
export const SERVING_PRESETS = [1, 2, 3, 4, 5];

export function partsLabel(count: number) {
  return `${count} part${count > 1 ? 's' : ''}`;
}
