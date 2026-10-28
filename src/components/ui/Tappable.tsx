import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { color } from '@/theme/tokens';

import { useReduceMotion } from './useReduceMotion';

/**
 * Retour au toucher commun (Figma « Retours au toucher — inventaire », règle proposée) :
 * - `opacity` : icônes, croix, liens et onglets seuls, à 0,6 tout de suite à l'appui ;
 * - `surface` : cartes, lignes et boutons pleins, dont le fond fonce d'un cran en 100 ms ;
 * - `card` : comme `surface`, avec une réduction à 0,97 (sauf « Réduire les animations »).
 * Tout revient en 150 ms au relâché.
 */
export type Feedback = 'opacity' | 'surface' | 'card';

export const PRESSED_OPACITY = 0.6;
const SURFACE_SHADE = 0.08;
const CARD_SCALE = 0.97;
const PRESS_IN = { opacity: 0, surface: 100, card: 100 } as const;
const PRESS_OUT = 150;

type TappableProps = Omit<PressableProps, 'style' | 'children'> & {
  feedback?: Feedback;
  /** Surface foncée (pastilles des minuteurs) : le voile s'éclaircit au lieu de foncer. */
  tint?: 'dark' | 'light';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Tappable({
  feedback = 'opacity',
  tint = 'dark',
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: TappableProps) {
  const reduceMotion = useReduceMotion();
  const press = useRef(new Animated.Value(0)).current;
  const animate = (toValue: number, duration: number) =>
    Animated.timing(press, { toValue, duration, useNativeDriver: true }).start();

  const shaded = feedback !== 'opacity';
  const pressStyle =
    feedback === 'opacity'
      ? { opacity: press.interpolate({ inputRange: [0, 1], outputRange: [1, PRESSED_OPACITY] }) }
      : feedback === 'card' && !reduceMotion
        ? { transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, CARD_SCALE] }) }] }
        : null;

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        animate(1, PRESS_IN[feedback]);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animate(0, PRESS_OUT);
        onPressOut?.(e);
      }}
      style={[style, pressStyle]}>
      {children}
      {shaded && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: StyleSheet.flatten(style)?.borderRadius,
              backgroundColor: tint === 'dark' ? color.pressShade : color.pressShadeOnDark,
              opacity: press.interpolate({
                inputRange: [0, 1],
                outputRange: [0, tint === 'dark' ? SURFACE_SHADE : 0.12],
              }),
            },
          ]}
        />
      )}
    </AnimatedPressable>
  );
}
