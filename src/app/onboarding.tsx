import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ART,
  FORK,
  FORK_BOX,
  INGREDIENTS,
  KNIFE,
  KNIFE_BOX,
  PLATE,
  PLATE_BOX,
} from '@/components/screens/import/ImportLoading';
import { AppText, Button, IconButton, TextButton } from '@/components/ui';
import { useProfile } from '@/data/ProfileContext';
import { color, radius, space } from '@/theme/tokens';

const NOTEBOOK = require('@/assets/images/illus/notebook.png');
const JAM = require('@/assets/images/illus/jam.png');

type Art = 'plate' | 'notebook' | 'jam';

/** Les trois temps forts de l'app : récupérer une recette, la retrouver, la cuisiner. */
const STEPS: { art: Art; title: string; message: string }[] = [
  {
    art: 'plate',
    title: 'Garde toutes tes recettes',
    message: 'Une vidéo Instagram ou TikTok, un site, une photo de livre : partage-la à Toqué, on en tire la recette.',
  },
  {
    art: 'notebook',
    title: 'Range ton carnet',
    message: 'Classe tes recettes par catégorie et retrouve-les en un instant avec la recherche et les filtres.',
  },
  {
    art: 'jam',
    title: 'Cuisine sereinement',
    message: 'Suis les étapes une à une, lance tes minuteurs et envoie les ingrédients dans ta liste de courses.',
  },
];

const LAST = STEPS.length - 1;
/** Pastille de l'étape en cours, allongée ; les autres restent rondes. */
const DOT = 8;
const DOT_ACTIVE = 24;
/** Part de l'étape laissée à l'illustration : les titres commencent à la même hauteur d'une étape à l'autre. */
const ART_SHARE = 0.55;

/**
 * Onboarding : trois écrans de présentation sur le fond brun de la marque, au premier lancement et depuis le profil.
 * Retour en haut à gauche, progression au centre, « Passer » à droite ; on avance au bouton ou en faisant glisser.
 * La dernière étape propose d'importer tout de suite une première recette ; « Passer » mène aux recettes.
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setOnboarded } = useProfile();
  const [index, setIndex] = useState(0);
  // Hauteur du carrousel : chaque étape la prend toute, pour garder textes et illustrations alignés d'une étape à l'autre.
  const [pageHeight, setPageHeight] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const pager = useRef<Animated.FlatList<(typeof STEPS)[number]>>(null);
  const reduceMotion = useReduceMotion();

  const goTo = (i: number) => {
    setIndex(i);
    pager.current?.scrollToOffset({ offset: i * width, animated: !reduceMotion });
    AccessibilityInfo.announceForAccessibility(`Étape ${i + 1} sur ${STEPS.length} : ${STEPS[i].title}`);
  };

  const finish = (importFirst: boolean) => {
    setOnboarded(true);
    router.dismissTo(importFirst ? { pathname: '/', params: { importer: '1' } } : '/');
  };

  // Android : le bouton retour du système revient à l'étape précédente.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index === 0) return false;
      goTo(index - 1);
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space[16], paddingBottom: insets.bottom + space[16] }]}>
      <View style={styles.topRow}>
        <View style={styles.side}>
          {index > 0 && (
            <IconButton icon="chevronLeft" accessibilityLabel="Étape précédente" onPress={() => goTo(index - 1)} />
          )}
        </View>
        <Dots scrollX={scrollX} width={width} index={index} />
        <View style={[styles.side, styles.sideEnd]}>
          <TextButton tone="onBrand" label="Passer" onPress={() => finish(false)} />
        </View>
      </View>

      <View style={styles.pager} onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
        <Animated.FlatList
          ref={pager}
          data={STEPS}
          keyExtractor={(step) => step.art}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: width, offset: i * width, index: i })}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: (e: { nativeEvent: { contentOffset: { x: number } } }) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              if (i !== index && i >= 0 && i <= LAST) setIndex(i);
            },
          })}
          scrollEventThrottle={16}
          renderItem={({ item, index: i }) => {
            // Parallaxe : l'illustration glisse moins vite que le texte et s'efface entre deux étapes.
            const range = [(i - 1) * width, i * width, (i + 1) * width];
            const artStyle = reduceMotion
              ? undefined
              : {
                  opacity: scrollX.interpolate({ inputRange: range, outputRange: [0, 1, 0], extrapolate: 'clamp' }),
                  transform: [
                    {
                      translateX: scrollX.interpolate({
                        inputRange: range,
                        outputRange: [width * 0.4, 0, -width * 0.4],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                };
            return (
              <View style={[styles.page, { width, height: pageHeight }]}>
                <Animated.View style={[styles.artArea, { height: pageHeight * ART_SHARE }, artStyle]}>
                  {item.art === 'plate' && <PlateArt active={i === index} reduceMotion={reduceMotion} />}
                  {item.art === 'notebook' && <Image source={NOTEBOOK} style={styles.notebook} resizeMode="contain" />}
                  {item.art === 'jam' && <Image source={JAM} style={styles.jam} resizeMode="contain" />}
                </Animated.View>
                <View style={styles.texts}>
                  <AppText variant="display" color={color.textOnBrandPrimary} accessibilityRole="header">
                    {item.title}
                  </AppText>
                  <AppText color={color.textOnBrandSecondary} style={styles.message}>
                    {item.message}
                  </AppText>
                </View>
              </View>
            );
          }}
        />
      </View>

      <View style={styles.actions}>
        <Button
          block
          variant="secondary"
          icon={index === LAST ? 'plus' : undefined}
          label={index === LAST ? 'Importer ma première recette' : 'Continuer'}
          onPress={() => (index === LAST ? finish(true) : goTo(index + 1))}
        />
      </View>
    </View>
  );
}

/** Progression : une pastille par étape, celle en cours s'allonge en suivant le glissé. */
function Dots({ scrollX, width, index }: { scrollX: Animated.Value; width: number; index: number }) {
  return (
    <View
      style={styles.dots}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Étape ${index + 1} sur ${STEPS.length}`}
      accessibilityValue={{ min: 1, max: STEPS.length, now: index + 1 }}>
      {STEPS.map((step, i) => {
        const range = [(i - 1) * width, i * width, (i + 1) * width];
        return (
          <Animated.View
            key={step.art}
            style={[
              styles.dot,
              {
                width: scrollX.interpolate({
                  inputRange: range,
                  outputRange: [DOT, DOT_ACTIVE, DOT],
                  extrapolate: 'clamp',
                }),
                opacity: scrollX.interpolate({ inputRange: range, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' }),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/** Figma « Composition 2 » : assiette et couverts ; les ingrédients y tombent à l'arrivée sur l'étape. */
function PlateArt({ active, reduceMotion }: { active: boolean; reduceMotion: boolean }) {
  const [scale, setScale] = useState(1);
  const drops = useRef(INGREDIENTS.map(() => new Animated.Value(reduceMotion ? 1 : 0))).current;

  useEffect(() => {
    if (!active || reduceMotion) return;
    drops.forEach((value) => value.setValue(0));
    const fall = Animated.stagger(
      180,
      drops.map((value) =>
        Animated.timing(value, { toValue: 1, duration: 700, easing: Easing.bounce, useNativeDriver: true }),
      ),
    );
    fall.start();
    return () => fall.stop();
  }, [active, reduceMotion, drops]);

  // L'illustration de 352 × 285 se réduit pour tenir dans la place laissée par les textes.
  const fit = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setScale(Math.min(1, width / ART.width, height / ART.height));
  };

  return (
    <View style={styles.fill} onLayout={fit}>
      <View style={[styles.plateArt, { transform: [{ scale }] }]}>
        <Image source={FORK} style={[styles.abs, FORK_BOX]} />
        <Image source={KNIFE} style={[styles.abs, KNIFE_BOX]} />
        <Image source={PLATE} style={[styles.abs, PLATE_BOX]} />
        {INGREDIENTS.map(({ image, box, spin }, i) => (
          <Animated.Image
            key={i}
            source={image}
            style={[
              styles.abs,
              box,
              {
                opacity: drops[i].interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
                transform: [
                  { translateY: drops[i].interpolate({ inputRange: [0, 1], outputRange: [-160, 0] }) },
                  { rotate: drops[i].interpolate({ inputRange: [0, 1], outputRange: [`${-spin}deg`, '0deg'] }) },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion, () => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);
  return reduceMotion;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: space[16],
  },
  side: {
    flex: 1,
    flexDirection: 'row',
  },
  sideEnd: {
    justifyContent: 'flex-end',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  dot: {
    height: DOT,
    borderRadius: radius.pill,
    backgroundColor: color.textOnBrandPrimary,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: space[16],
    paddingTop: space[24],
    paddingBottom: space[32],
    gap: space[32],
  },
  artArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    alignSelf: 'stretch',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateArt: {
    width: ART.width,
    height: ART.height,
  },
  abs: {
    position: 'absolute',
  },
  notebook: {
    width: 280,
    maxHeight: '100%',
    aspectRatio: 672 / 612,
  },
  jam: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 833 / 531,
  },
  texts: {
    gap: space[16],
  },
  message: {
    lineHeight: 24,
  },
  actions: {
    alignItems: 'center',
    gap: space[24],
    paddingHorizontal: space[16],
  },
});
