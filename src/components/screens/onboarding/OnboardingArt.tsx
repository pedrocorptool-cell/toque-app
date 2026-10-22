import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

/** Figma « Onbarding » (578:7999) : illustrations de 361 × 300, chaque calque exporté à sa place. */
export const ART = { width: 361, height: 300 };

type Box = { left: number; top: number; width: number; height: number };
type Layer = { image: number; box: Box };

const layer = (image: number, left: number, top: number, width: number, height: number): Layer => ({
  image,
  box: { left, top, width, height },
});

const IMPORT = {
  base: layer(require('@/assets/images/onboarding/i1-base.png'), 24.3, 171, 315.7, 116.7),
  icons: [
    layer(require('@/assets/images/onboarding/i1-ig.png'), 117.7, 25.3, 64.7, 64.7),
    layer(require('@/assets/images/onboarding/i1-photo.png'), 193, 0, 59.7, 58),
    layer(require('@/assets/images/onboarding/i1-tiktok.png'), 196, 84.7, 55, 55.3),
    layer(require('@/assets/images/onboarding/i1-fb.png'), 118.3, 103, 57, 57),
    layer(require('@/assets/images/onboarding/i1-link.png'), 158, 159.7, 59, 59),
  ],
};
/** Creux de l'assiette, où les icônes disparaissent. */
const WELL = { x: 178, y: 232 };

const SORTER = {
  base: layer(require('@/assets/images/onboarding/i2-base.png'), 38, 71.7, 235.7, 212.3),
  // Départ hors du trieur, puis glissement jusque derrière la couverture.
  cards: [
    {
      ...layer(require('@/assets/images/onboarding/i2-card-top.png'), 144.3, 18.3, 68, 78),
      from: [0, -50],
      into: [0, 90],
    },
    {
      ...layer(require('@/assets/images/onboarding/i2-card-right.png'), 240.3, 105.7, 78.3, 90),
      from: [50, 0],
      into: [-95, 0],
    },
  ],
};

const LIST = {
  base: layer(require('@/assets/images/onboarding/i3-base.png'), 41, 25, 279.7, 256.3),
  checks: [
    layer(require('@/assets/images/onboarding/i3-check1.png'), 120.7, 112, 28, 27),
    layer(require('@/assets/images/onboarding/i3-check2.png'), 120.7, 137.3, 28, 27),
    layer(require('@/assets/images/onboarding/i3-check3.png'), 120.7, 162.3, 28, 27),
    layer(require('@/assets/images/onboarding/i3-check4.png'), 120.7, 188.3, 28, 27),
  ],
};
/** Dans la maquette, les deux premières cases sont cochées. */
const CHECKED_AT_REST = 2;

export type ArtName = 'import' | 'sorter' | 'list';

type ArtProps = {
  name: ArtName;
  /** L'animation ne tourne que sur l'étape affichée ; ailleurs, l'illustration reste comme dans Figma. */
  playing: boolean;
  scale: number;
};

export function OnboardingArt({ name, playing, scale }: ArtProps) {
  return (
    <View style={{ width: ART.width * scale, height: ART.height * scale }}>
      <View style={[styles.canvas, { transform: [{ scale }] }]}>
        {name === 'import' && <ImportArt playing={playing} />}
        {name === 'sorter' && <SorterArt playing={playing} />}
        {name === 'list' && <ListArt playing={playing} />}
      </View>
    </View>
  );
}

/** Joue `make()` en boucle tant que `playing`, et remet les valeurs au repos à l'arrêt. */
function useLoop(playing: boolean, values: Animated.Value[], rest: number[], make: () => Animated.CompositeAnimation) {
  useEffect(() => {
    if (!playing) {
      values.forEach((value, i) => value.setValue(rest[i]));
      return;
    }
    values.forEach((value) => value.setValue(0));
    const loop = Animated.loop(make());
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);
}

const timing = (value: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.quad)) =>
  Animated.timing(value, { toValue, duration, easing, useNativeDriver: true });

const reset = (values: Animated.Value[]) => Animated.parallel(values.map((value) => timing(value, 0, 0)));

/** 1 · Les icônes tombent l'une après l'autre dans l'assiette, comme l'écran « Import en cours ». */
function ImportArt({ playing }: { playing: boolean }) {
  const progress = useRef(IMPORT.icons.map(() => new Animated.Value(0))).current;
  // Au repos (étape non affichée ou « Réduire les animations ») : les icônes en l'air, comme dans Figma.
  useLoop(
    playing,
    progress,
    IMPORT.icons.map(() => -1),
    () =>
      Animated.sequence([
        Animated.stagger(
          260,
          progress.map((value) =>
            Animated.sequence([
              timing(value, 1, 650, Easing.in(Easing.quad)),
              timing(value, 2, 200, Easing.out(Easing.quad)),
            ]),
          ),
        ),
        Animated.delay(600),
        reset(progress),
      ]),
  );

  return (
    <>
      <Image source={IMPORT.base.image} style={[styles.abs, IMPORT.base.box]} />
      {IMPORT.icons.map(({ image, box }, i) => {
        const value = progress[i];
        // -1 : place Figma ; de 0 à 1 : chute depuis 140 px au-dessus jusqu'au creux ; de 1 à 2 : l'icône s'enfonce.
        const landX = WELL.x - (box.left + box.width / 2);
        const landY = WELL.y - (box.top + box.height / 2);
        const style = {
          opacity: value.interpolate({ inputRange: [-1, 0, 0.15, 1, 2], outputRange: [1, 0, 1, 1, 0] }),
          transform: [
            { translateX: value.interpolate({ inputRange: [-1, 0, 1, 2], outputRange: [0, 0, landX, landX] }) },
            {
              translateY: value.interpolate({
                inputRange: [-1, 0, 1, 2],
                outputRange: [0, -140, landY, landY + 6],
              }),
            },
            { scale: value.interpolate({ inputRange: [-1, 0, 1, 2], outputRange: [1, 1, 0.8, 0.3] }) },
          ],
        };
        return <Animated.Image key={i} source={image} style={[styles.abs, box, style]} />;
      })}
    </>
  );
}

/** 2 · Les fiches arrivent puis glissent dans le trieur, l'une après l'autre. */
function SorterArt({ playing }: { playing: boolean }) {
  const progress = useRef(SORTER.cards.map(() => new Animated.Value(0))).current;
  useLoop(
    playing,
    progress,
    SORTER.cards.map(() => 1),
    () =>
      Animated.sequence([
        Animated.stagger(
          500,
          progress.map((value) =>
            Animated.sequence([
              timing(value, 1, 450, Easing.out(Easing.quad)),
              Animated.delay(450),
              timing(value, 2, 500),
            ]),
          ),
        ),
        Animated.delay(500),
        reset(progress),
      ]),
  );

  return (
    <>
      {/* Sous le trieur : une fiche qui y entre passe derrière la couverture. */}
      {SORTER.cards.map(({ image, box, from, into }, i) => {
        const value = progress[i];
        const style = {
          opacity: value.interpolate({ inputRange: [0, 0.4, 2], outputRange: [0, 1, 1] }),
          transform: [
            { translateX: value.interpolate({ inputRange: [0, 1, 2], outputRange: [from[0], 0, into[0]] }) },
            { translateY: value.interpolate({ inputRange: [0, 1, 2], outputRange: [from[1], 0, into[1]] }) },
          ],
        };
        return <Animated.Image key={i} source={image} style={[styles.abs, box, style]} />;
      })}
      <Image source={SORTER.base.image} style={[styles.abs, SORTER.base.box]} />
    </>
  );
}

/** 3 · Les cases de la liste se cochent l'une après l'autre. */
function ListArt({ playing }: { playing: boolean }) {
  const progress = useRef(LIST.checks.map(() => new Animated.Value(0))).current;
  useLoop(
    playing,
    progress,
    LIST.checks.map((_, i) => (i < CHECKED_AT_REST ? 1 : 0)),
    () =>
      Animated.sequence([
        Animated.delay(300),
        Animated.stagger(
          450,
          progress.map((value) => timing(value, 1, 250, Easing.out(Easing.back(2)))),
        ),
        Animated.delay(1200),
        Animated.parallel(progress.map((value) => timing(value, 0, 250))),
        Animated.delay(300),
      ]),
  );

  return (
    <>
      <Image source={LIST.base.image} style={[styles.abs, LIST.base.box]} />
      {LIST.checks.map(({ image, box }, i) => (
        <Animated.Image
          key={i}
          source={image}
          style={[
            styles.abs,
            box,
            {
              opacity: progress[i],
              transform: [{ scale: progress[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
            },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: ART.width,
    height: ART.height,
    transformOrigin: 'top left',
  },
  abs: {
    position: 'absolute',
  },
});
