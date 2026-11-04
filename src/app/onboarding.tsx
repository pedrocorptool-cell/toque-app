import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  StyleSheet,
  type GestureResponderEvent,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ART, OnboardingArt, type ArtName } from '@/components/screens/onboarding/OnboardingArt';
import { AccountStep, type AccountMode } from '@/components/screens/onboarding/AccountStep';
import { AvatarChooser } from '@/components/screens/profile/AvatarChooser';
import { AppText, Button, IconButton, Logo, TextButton } from '@/components/ui';
import { useProfile } from '@/data/ProfileContext';
import { useSpace } from '@/data/SpaceContext';
import type { AvatarId } from '@/data/profile';
import { color, font, radius, space } from '@/theme/tokens';

// Espaces insécables devant « : » et « ! » : la ponctuation ne part pas seule à la ligne.
type Step = { key: string; art: ArtName; text: string } | { key: 'avatar'; text: string };

const STEPS: Step[] = [
  {
    key: 'import',
    art: 'import',
    text: 'Ne scrolle plus dans tes favoris sans fin : importe toutes tes recettes dans Toqué !',
  },
  {
    key: 'sorter',
    art: 'sorter',
    text: 'Organise tes catégories, filtre tes recettes par créateur ou temps de préparation !',
  },
  {
    key: 'list',
    art: 'list',
    text: 'Fini les vidéos sur pause et les allers-retours entre apps. Suis chaque étape, minuteur en main.',
  },
  // Dernière étape : le choix de l'avatar, enregistré au « Valider ». Avant elle, l'écran du pseudo Toqué.
  { key: 'avatar', text: 'Choisis ton avatar Toqué pour créer ton compte' },
];

const LAST = STEPS.length - 1;
/** Figma : pastille de l'étape en cours de 16 × 8, les autres de 8 × 8. */
const DOT = 8;
const DOT_ACTIVE = 16;
/** Figma : texte sur 4 lignes de 38 px, à 40 px sous l'illustration. */
const TEXT_HEIGHT = 4 * 38;
const ART_GAP = space[40];
/** Distance d'un glissé vers l'étape suivante, en px. */
const SWIPE = 40;

/**
 * Figma « Onbarding » (578:7999) : quatre écrans sur le fond brun, au premier lancement et depuis le profil.
 * Retour, logo et « Ignorer » en haut ; progression et CTA en bas ; on avance au bouton ou en faisant glisser.
 * Chaque illustration s'anime quand son étape est affichée ; la dernière étape fait choisir l'avatar Toqué.
 * Sans espace Toqué, on ne passe à l'avatar qu'après avoir créé son pseudo ou s'être connecté (Figma 748:6064,
 * 1013:17485).
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { account, avatar, setAvatar, setOnboarded } = useProfile();
  const { join } = useSpace();
  // Revue depuis le profil : l'espace existe déjà, l'avatar se valide sans créer de compte.
  const [hadAccount] = useState(Boolean(account.toqueId));
  const hasAccount = Boolean(account.toqueId);
  // Écran du pseudo, par-dessus le carrousel qui reste en place pour l'avatar.
  const [accountMode, setAccountMode] = useState<AccountMode | null>(null);
  // Sans espace, la page de l'avatar n'existe pas encore : on ne peut pas l'atteindre en glissant. Elle apparaît une
  // fois le compte créé, et on y va dès qu'elle est en place.
  const pages = hasAccount ? STEPS : STEPS.slice(0, LAST);
  const [avatarPending, setAvatarPending] = useState(false);
  const touchX = useRef(0);
  const [avatarId, setAvatarId] = useState<AvatarId>(avatar.kind === 'toque' ? avatar.id : 'onion');
  const [background, setBackground] = useState(avatar.kind === 'toque' ? avatar.background : color.accentCreme);
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
    AccessibilityInfo.announceForAccessibility(i < LAST ? `Étape ${i + 1} sur ${LAST}` : 'Choix de l’avatar');
  };

  /** Avant l'avatar, l'espace Toqué : sans lui, « Continuer », « Ignorer » ou un glissé ouvrent l'écran du pseudo. */
  const askSpace = () => {
    goTo(LAST - 1);
    setAccountMode('create');
  };
  const next = () => {
    if (index === LAST) return finish(true);
    if (index === LAST - 1 && !hasAccount) return askSpace();
    goTo(index + 1);
  };

  /** « Ignorer » garde l'avatar actuel ; « Valider » enregistre celui choisi. */
  const finish = (saveAvatar: boolean) => {
    if (saveAvatar) setAvatar({ kind: 'toque', id: avatarId, background });
    setOnboarded(true);
    router.dismissTo('/');
  };

  // Android : le bouton retour du système revient à l'étape précédente.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (accountMode) {
        setAccountMode(null);
        return true;
      }
      if (index === 0) return false;
      goTo(index - 1);
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, accountMode]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space[24], paddingBottom: insets.bottom + space[24] }]}>
      <View style={styles.topRow}>
        <View style={styles.side}>
          {(index > 0 || accountMode) && (
            <IconButton
              icon="chevronLeft"
              accessibilityLabel="Étape précédente"
              onPress={() => (accountMode ? setAccountMode(null) : goTo(index - 1))}
            />
          )}
        </View>
        <Logo />
        <View style={[styles.side, styles.sideEnd]}>
          {/* Le pseudo ne s'ignore pas : sans lui, pas d'espace où ranger les recettes. */}
          {!accountMode && (
            <TextButton tone="onBrand" label="Ignorer" onPress={() => (hasAccount ? finish(false) : askSpace())} />
          )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.pager} onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
          <Animated.FlatList
            ref={pager}
            data={pages}
            keyExtractor={(step) => step.key}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, i) => ({ length: width, offset: i * width, index: i })}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: false,
              listener: (e: { nativeEvent: { contentOffset: { x: number } } }) => {
                const i = Math.round(e.nativeEvent.contentOffset.x / width);
                if (i !== index && i >= 0 && i < pages.length) setIndex(i);
              },
            })}
            // Glisser vers la gauche sur la 3e étape fait comme « Continuer » : sans espace, l'écran du pseudo s'ouvre.
            onTouchStart={(e) => (touchX.current = pageXOf(e))}
            onTouchEnd={(e) => {
              const swipedNext = touchX.current - pageXOf(e) > SWIPE;
              if (swipedNext && !hasAccount && index === LAST - 1 && !accountMode) askSpace();
            }}
            onContentSizeChange={(w) => {
              if (avatarPending && w >= STEPS.length * width - 1) {
                setAvatarPending(false);
                goTo(LAST);
              }
            }}
            scrollEventThrottle={16}
            renderItem={({ item, index: i }) =>
              'art' in item ? (
                <View style={[styles.page, { width, height: pageHeight }]}>
                  <OnboardingArt name={item.art} playing={i === index && !reduceMotion} scale={artScale} />
                  <AppText color={color.textOnBrandPrimary} style={styles.text} accessibilityRole="header">
                    {item.text}
                  </AppText>
                </View>
              ) : (
                // Pas de marge latérale : le carrousel d'avatars prend toute la largeur de l'écran.
                <View style={[styles.avatarPage, { width, height: pageHeight }]}>
                  <AvatarChooser
                    avatarId={avatarId}
                    onAvatarChange={setAvatarId}
                    background={background}
                    onBackgroundChange={setBackground}>
                    <AppText
                      color={color.textOnBrandPrimary}
                      style={[styles.text, styles.avatarText]}
                      accessibilityRole="header">
                      {hadAccount ? 'Choisis ton avatar Toqué' : item.text}
                    </AppText>
                  </AvatarChooser>
                </View>
              )
            }
          />
        </View>

        <View style={styles.bottom}>
          <Dots scrollX={scrollX} width={width} index={index} />
          <Button
            block
            variant="secondary"
            label={index === LAST ? (hadAccount ? 'Valider' : 'Valider et créer mon compte') : 'Continuer'}
            onPress={next}
          />
        </View>

        {accountMode && (
          <View style={styles.account}>
            <AccountStep
              mode={accountMode}
              onModeChange={setAccountMode}
              onSubmit={async (pseudo, mode) => {
                const returning = await join(pseudo, mode === 'create' ? 'create' : 'join');
                setAccountMode(null);
                // Espace déjà configuré (autre téléphone, réinstallation) : l'avatar est retrouvé, pas besoin de le redemander.
                if (returning) router.dismissTo('/');
                else setAvatarPending(true);
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

/** Abscisse du doigt : le web passe l'événement du navigateur, où elle est dans `changedTouches`. */
function pageXOf(e: GestureResponderEvent) {
  const event = e.nativeEvent as GestureResponderEvent['nativeEvent'] & { changedTouches?: { pageX: number }[] };
  return event.pageX ?? event.changedTouches?.[0]?.pageX ?? 0;
}

/** Les trois présentations : l'avatar, qui crée le compte, n'a pas de pastille (Figma 748:6241). */
const SLIDES = STEPS.filter((step) => 'art' in step);

/**
 * Progression : une pastille par présentation, celle en cours s'allonge et passe au bleu en suivant le glissé.
 * Elles s'effacent en arrivant sur l'avatar, en gardant leur place pour que le bouton ne bouge pas.
 */
function Dots({ scrollX, width, index }: { scrollX: Animated.Value; width: number; index: number }) {
  const opacity = scrollX.interpolate({
    inputRange: [(SLIDES.length - 1) * width, SLIDES.length * width],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View
      style={[styles.dots, { opacity }]}
      accessible={index < SLIDES.length}
      accessibilityElementsHidden={index >= SLIDES.length}
      importantForAccessibility={index < SLIDES.length ? 'yes' : 'no-hide-descendants'}
      accessibilityRole="progressbar"
      accessibilityLabel={`Étape ${index + 1} sur ${SLIDES.length}`}
      accessibilityValue={{ min: 1, max: SLIDES.length, now: index + 1 }}>
      {SLIDES.map((step, i) => {
        const range = [(i - 1) * width, i * width, (i + 1) * width];
        return (
          <Animated.View
            key={step.key}
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
    </Animated.View>
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
  body: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  account: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.bgBrandPage,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: ART_GAP,
    paddingHorizontal: space[16],
  },
  avatarPage: {
    justifyContent: 'center',
  },
  // Figma : Zalando Sans Regular 28 / 38, sans style de texte partagé.
  text: {
    alignSelf: 'stretch',
    minHeight: TEXT_HEIGHT,
    fontFamily: font.regular,
    fontSize: 28,
    lineHeight: 38,
  },
  // Figma : deux lignes centrées entre le carrousel et les couleurs.
  avatarText: {
    minHeight: 0,
    paddingHorizontal: space[16],
    textAlign: 'center',
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
