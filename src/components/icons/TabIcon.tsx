import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { motion } from '@/theme/motion';

/**
 * Icônes de la barre d'onglets en traits de 1,5 px (les mêmes que « book », « basket » et « profile », redessinées
 * en tracés) : au clic sur l'onglet, chaque trait se redessine, l'un après l'autre.
 */
export type TabIconName = 'book' | 'basket' | 'profile';

/** `length` : longueur du tracé (un peu arrondie au-dessus), `at` : départ dans l'animation, de 0 à 1. */
type Stroke = { d: string; length: number; at: number };

const STROKES: Record<TabIconName, Stroke[]> = {
  // Couverture, puis la tranche du bas.
  book: [
    { d: 'M4.5 20.25A2.25 2.25 0 0 1 6.75 18H19.5V3H6.75A2.25 2.25 0 0 0 4.5 5.25Z', length: 63, at: 0 },
    { d: 'M4.5 20.25V21H18', length: 15, at: 0.45 },
  ],
  // Anse, panier, puis les trois lattes comme des articles qu'on y dépose.
  basket: [
    { d: 'M6.75 8.25L12 2.25L17.25 8.25', length: 16, at: 0 },
    { d: 'M2.25 8.25H21.75L20.25 19.5H3.75Z', length: 59, at: 0.15 },
    { d: 'M7.05 11.25L7.58 16.5', length: 5.5, at: 0.55 },
    { d: 'M12 11.25V16.5', length: 5.5, at: 0.65 },
    { d: 'M16.95 11.25L16.43 16.5', length: 5.5, at: 0.75 },
  ],
  // Tête depuis le haut, puis les épaules depuis le milieu vers chaque côté.
  profile: [
    { d: 'M12 3A6 6 0 1 1 12 15A6 6 0 1 1 12 3Z', length: 38, at: 0 },
    { d: 'M12 15C8.02 15 4.72 17.11 2.91 20.25', length: 11.5, at: 0.5 },
    { d: 'M12 15C15.98 15 19.28 17.11 21.09 20.25', length: 11.5, at: 0.5 },
  ],
};

const DURATION = 480;
/** Part de l'animation que dure chaque trait. */
const STROKE_SPAN = 0.5;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Les traits se touchent (anse et panier, tête et épaules) : avec une couleur semi-transparente, leurs croisements
 * fonceraient. On trace en couleur pleine et on applique la transparence à l'icône entière.
 */
function splitAlpha(value: string) {
  const rgba = value.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/);
  return rgba
    ? { solid: `rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})`, opacity: Number(rgba[4]) }
    : { solid: value, opacity: 1 };
}

type TabIconProps = {
  name: TabIconName;
  color: string;
  /** Change à chaque clic sur l'onglet : relance le tracé. 0 au premier affichage, sans animation. */
  play: number;
  reduceMotion: boolean;
};

export function TabIcon({ name, color, play, reduceMotion }: TabIconProps) {
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!play || reduceMotion) return;
    progress.setValue(0);
    // Le tracé SVG n'est pas animable par le driver natif.
    const draw = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: motion.easeOut,
      useNativeDriver: false,
    });
    draw.start();
    return () => draw.stop();
  }, [play, reduceMotion, progress]);

  const { solid, opacity } = splitAlpha(color);

  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <G opacity={opacity}>
        {STROKES[name].map(({ d, length, at }) => (
          <AnimatedPath
            key={d}
            d={d}
            stroke={solid}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={length}
            strokeDashoffset={progress.interpolate({
              inputRange: [at, Math.min(1, at + STROKE_SPAN)],
              outputRange: [length, 0],
              extrapolate: 'clamp',
            })}
          />
        ))}
      </G>
    </Svg>
  );
}
