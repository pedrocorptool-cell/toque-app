import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, BackHandler, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ART, OnboardingArt, type ArtName } from '@/components/screens/onboarding/OnboardingArt';
import { AppText, Button, IconButton, Logo, TextButton } from '@/components/ui';
import { useProfile } from '@/data/ProfileContext';
import { color, font, radius, space } from '@/theme/tokens';

// Espaces insécables devant « : » et « ! » : la ponctuation ne part pas seule à la ligne.
const STEPS: { art: ArtName; text: string }[] = [
  { art: 'import', text: 'Ne scrolle plus dans tes favoris sans fin : importe toutes tes recettes dans Toqué !' },
  { art: 'sorter', text: 'Organise tes catégories, filtre tes recettes par créateur ou temps de préparation !' },
  {
    art: 'list',
    text: 'Fini les vidéos sur pause et les allers-retours entre apps. Suis chaque étape, minuteur en main.',
  },
];

const LAST = STEPS.length - 1;
/** Figma : pastille de l'étape en cours de 16 × 8, les autres de 8 × 8. */
const DOT = 8;
const DOT_ACTIVE = 16;
/** Figma : texte sur 4 lignes de 38 px, à 40 px sous l'illustration. */
const TEXT_HEIGHT = 4 * 38;
const ART_GAP = space[40];

/**
 * Figma « Onbarding » (578:7999) : trois écrans sur le fond brun, au premier lancement et depuis le profil.
 * Retour, logo et « Ignorer » en haut ; progression et CTA en bas ; on avance au bouton ou en faisant glisser.
 * Chaque illustration s'anime quand son étape est affichée.
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setOnboarded } = useProfile();
  const [index, setIndex] = useState(0);
  // Hauteur du carrousel, pour réduire l'illustration sur les petits écrans.
  const [pageHeight, setPageHeight] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const pager = useRef<Animated.FlatList<(typeof STEPS)[number]>>(null);
  const reduceMotion = useReduceMotion();

  const contentWidth = width - space[16] * 2;
  const artScale = Math.min(
    1,
    contentWidth / ART.width,
    pageHeight ? (pageHeight - TEXT_HEIGHT - ART_GAP - space[24]) / ART.height : 1,
  );

  const goTo = (i: number) => {
    setIndex(i);
    pager.current?.scrollToOffset({ offset: i * width, animated: !reduceMotion });
    AccessibilityInfo.announceForAccessibility(`Étape ${i + 1} sur ${STEPS.length}`);
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
    <View style={[styles.screen, { paddingTop: insets.top + space[24], paddingBottom: insets.bottom + space[24] }]}>
      <View style={styles.topRow}>
        <View style={styles.side}>
          {index > 0 && (
            <IconButton icon="chevronLeft" accessibilityLabel="Étape précédente" onPress={() => goTo(index - 1)} />
          )}
        </View>
        <Logo />
        <View style={[styles.side, styles.sideEnd]}>
          <TextButton tone="onBrand" label="Ignorer" onPress={() => finish(false)} />
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
          renderItem={({ item, index: i }) => (
            <View style={[styles.page, { width, height: pageHeight }]}>
              <OnboardingArt name={item.art} playing={i === index && !reduceMotion} scale={artScale} />
              <AppText color={color.textOnBrandPrimary} style={styles.text} accessibilityRole="header">
                {item.text}
              </AppText>
            </View>
          )}
        />
      </View>

      <View style={styles.bottom}>
        <Dots scrollX={scrollX} width={width} index={index} />
        <Button
          block
          variant="secondary"
          label={index === LAST ? 'Importer ma première recette' : 'Continuer'}
          onPress={() => (index === LAST ? finish(true) : goTo(index + 1))}
        />
      </View>
    </View>
  );
}

/** Progression : une pastille par étape, celle en cours s'allonge et passe au bleu en suivant le glissé. */
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
                backgroundColor: scrollX.interpolate({
                  inputRange: range,
                  outputRange: [color.textPrimary, color.accentBlue, color.textPrimary],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        );
      })}
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
    height: 40,
    paddingHorizontal: space[16],
  },
  side: {
    flex: 1,
    flexDirection: 'row',
  },
  sideEnd: {
    justifyContent: 'flex-end',
  },
  pager: {
    flex: 1,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: ART_GAP,
    paddingHorizontal: space[16],
  },
  // Figma : Zalando Sans Regular 28 / 38, sans style de texte partagé.
  text: {
    alignSelf: 'stretch',
    minHeight: TEXT_HEIGHT,
    fontFamily: font.regular,
    fontSize: 28,
    lineHeight: 38,
  },
  bottom: {
    gap: space[24],
    paddingHorizontal: space[16],
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: space[4],
  },
  dot: {
    height: DOT,
    borderRadius: radius.pill,
  },
});
