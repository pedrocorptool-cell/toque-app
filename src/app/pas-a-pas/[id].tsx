import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as ImagePicker from 'expo-image-picker';
import { useKeepAwake } from 'expo-keep-awake';

import { BlurGlow } from '@/components/art/BlurGlow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { FinishStep } from '@/components/screens/recipe/FinishStep';
import { TimerSheet } from '@/components/screens/TimerSheet';
import { AppText, IconButton, TimerCard, TimerChip, Toast, Tappable } from '@/components/ui';
import { useRecipes } from '@/data/RecipesContext';
import { isDone, orderTimers, useTimers } from '@/data/TimersContext';
import { goBack } from '@/navigation/goBack';
import { blur, color, radius, space, text } from '@/theme/tokens';

/** Figma : halo flouté de 194 × 120 dans le coin haut gauche (flou `blur.glow`). */
const GLOW_WIDTH = 194;
const GLOW_HEIGHT = 120;
const THUMB = 80;
const TRANSITION = 500;
/** Durée du passage de la carte minuteur à la pastille du bas. */
const FLIGHT = 450;
/** Hauteur de la rangée de boutons du bas (48 px + 24 px de marge) et 16 px d'écart : le toast se pose au-dessus. */
const BOTTOM_ROW = space[24] + 48 + space[16];

type Origin = { px: number; py: number; ps: number; by: number; bh: number };
type Rect = { x: number; y: number; width: number; height: number };
type Flight = { from: Rect; to?: Rect; remaining: number };

/** Position de la photo et du flou sur la fiche, transmise à l'ouverture. */
function readOrigin(params: Record<string, string | undefined>): Origin | null {
  const values = ['px', 'py', 'ps', 'by', 'bh'].map((k) => Number(params[k]));
  if (values.some((v) => !Number.isFinite(v))) return null;
  const [px, py, ps, by, bh] = values;
  return { px, py, ps, by, bh };
}

/** Figma : « Recette/ Stepp/ Minuteur off » (191:4929) et « Minuteur on » (352:12715). */
export default function StepByStepScreen() {
  const params = useLocalSearchParams<{
    id: string;
    px?: string;
    py?: string;
    ps?: string;
    by?: string;
    bh?: string;
  }>();
  const { id } = params;
  // En cuisine, les mains sont prises : l'écran reste allumé tant que le mode étape par étape est ouvert.
  useKeepAwake();
  const { width: screenWidth } = useWindowDimensions();
  const { recipes, setRecipeImage } = useRecipes();
  const { timers: allTimers, timerFor, toggle, beforeTimerStart, setFocusedRecipeId } = useTimers();
  const insets = useSafeAreaInsets();
  const recipe = recipes.find((r) => r.id === id);

  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [timersOpen, setTimersOpen] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);

  // Comme sur la fiche : un minuteur de cette recette qui se termine ouvre la sheet, pas le dialogue global.
  useFocusEffect(
    useCallback(() => {
      setFocusedRecipeId(id ?? null);
      return () => setFocusedRecipeId(null);
    }, [id, setFocusedRecipeId]),
  );

  // Minuteurs lancés, de cette recette et des autres : regroupés dans une pastille parmi les actions du bas (le
  // plus proche de sonner affiché).
  const timers = orderTimers(allTimers, id);
  const nextTimer = [...timers].sort((x, y) => x.remaining - y.remaining)[0];

  // Un minuteur arrive à zéro : la sheet s'ouvre, comme sur la fiche.
  const doneCount = timers.filter(isDone).length;
  const previousDone = useRef(doneCount);
  useEffect(() => {
    if (doneCount > previousDone.current) setTimersOpen(true);
    previousDone.current = doneCount;
  }, [doneCount]);

  useEffect(() => {
    if (timers.length === 0) setTimersOpen(false);
  }, [timers.length]);

  // Lancement depuis la carte : elle se resserre et glisse jusqu'à la pastille du bas.
  const cardRef = useRef<View>(null);
  const chipRef = useRef<View>(null);
  const flight = useRef(new Animated.Value(0)).current;
  const [flying, setFlying] = useState<Flight | null>(null);

  // La pastille vient d'apparaître (ou de changer) : on mesure sa place une fois affichée.
  useEffect(() => {
    if (!flying || flying.to) return;
    const frame = requestAnimationFrame(() =>
      chipRef.current?.measureInWindow((x, y, width, height) =>
        setFlying((f) => f && { ...f, to: { x, y, width, height } }),
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, [flying]);

  const landed = flying?.to;
  useEffect(() => {
    if (!landed) return;
    flight.setValue(0);
    Animated.timing(flight, {
      toValue: 1,
      duration: FLIGHT,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setFlying(null));
  }, [landed, flight]);

  // Transition depuis la fiche : 0 = photo et flou à leur place sur la fiche, 1 = place du mode étape.
  // Animée en JS (tailles et positions), ce que le pilote natif ne sait pas faire.
  const origin = useRef(readOrigin(params)).current;
  const progress = useRef(new Animated.Value(origin ? 0 : 1)).current;
  const [settled, setSettled] = useState(!origin);

  useEffect(() => {
    if (!origin) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: TRANSITION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(() => setSettled(true));
  }, [origin, progress]);

  // Quitter depuis l'écran de fin : simple fondu, la vignette n'y est plus à sa place du mode étape.
  const leave = useRef(new Animated.Value(1)).current;
  const ending = useRef(false);

  /** Quitter : la photo et le flou reviennent à leur place sur la fiche avant de fermer. */
  const close = useCallback(() => {
    if (ending.current) {
      return Animated.timing(leave, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
        goBack(`/recette/${id}`),
      );
    }
    if (!origin) return goBack(`/recette/${id}`);
    setSettled(false);
    Animated.timing(progress, {
      toValue: 0,
      duration: TRANSITION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(() => goBack(`/recette/${id}`));
  }, [origin, progress, id, leave]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  // Changement d'étape : le texte glisse depuis le côté de la flèche touchée.
  const enter = useRef(new Animated.Value(1)).current;
  const direction = useRef(1);

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, enter]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!recipe) return null;

  // Après la dernière étape vient l'écran de fin (index = nombre d'étapes).
  const finished = index === recipe.steps.length;
  ending.current = finished;
  const step = recipe.steps[index];
  const timer = timerFor(recipe.id, index);

  // Pendant le trajet, la pastille n'apparaît qu'à l'arrivée de la carte.
  const chipOpacity = flight.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0, 0, 1] });

  const startTimer = async (seconds: number) => {
    if (!timer) await beforeTimerStart();
    // La pastille est déjà là : son compteur suffit, pas de trajet.
    if (timers.length) return toggle(recipe.id, index, seconds);
    cardRef.current?.measureInWindow((x, y, width, height) => {
      flight.setValue(0);
      setFlying({ from: { x, y, width, height }, remaining: seconds });
      toggle(recipe.id, index, seconds);
    });
  };

  /** Appareil photo, ou galerie s'il n'est pas disponible (simulateur) ou refusé. */
  const takePhoto = async () => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const result = camera.granted
      ? await ImagePicker.launchCameraAsync(options).catch(() => ImagePicker.launchImageLibraryAsync(options))
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    setRecipeImage(recipe.id, result.assets[0].uri);
    setPhotoTaken(true);
  };

  const goTo = (next: number) => {
    direction.current = next > index ? 1 : -1;
    setIndex(next);
  };

  const translateX = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [direction.current * 32, 0],
  });

  const from = origin ?? {
    px: space[16],
    py: insets.top + space[16],
    ps: THUMB,
    by: 0,
    bh: GLOW_HEIGHT + insets.top,
  };
  const glowHeight = GLOW_HEIGHT + insets.top;
  const lerp = (a: number, b: number) => progress.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  // Le contenu de l'étape n'apparaît qu'une fois la photo presque à sa place.
  const contentOpacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View style={[styles.screen, { opacity: leave }]}>
      {/* Fond brun en fondu : la fiche reste visible dessous au début de la transition. */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]} />

      {/* Le flou de la fiche (140) se resserre en halo (100) : les deux calques se croisent en fondu
          pendant qu'ils se redimensionnent depuis le coin haut gauche. */}
      {!settled && (
        <Animated.View
          style={[
            styles.glow,
            {
              top: lerp(from.by, 0),
              opacity: lerp(1, 0),
              transform: [{ scaleX: lerp(1, GLOW_WIDTH / screenWidth) }, { scaleY: lerp(1, glowHeight / from.bh) }],
            },
          ]}>
          <BlurGlow source={recipe.image} width={screenWidth} height={from.bh} blur={blur.hero} />
        </Animated.View>
      )}
      <Animated.View
        style={[
          styles.glow,
          {
            top: 0,
            // L'écran de fin a son propre halo, derrière le timbre.
            opacity: finished ? 0 : progress,
            transform: [{ scaleX: lerp(screenWidth / GLOW_WIDTH, 1) }, { scaleY: lerp(from.bh / glowHeight, 1) }],
          },
        ]}>
        <BlurGlow source={recipe.image} width={GLOW_WIDTH} height={glowHeight} blur={blur.glow} />
      </Animated.View>

      {finished ? (
        // Écran de fin (Figma 452:1752) : plein écran, sans vignette ni barre du bas.
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: enter }]}>
          <FinishStep
            image={recipe.image}
            photoTaken={photoTaken}
            onTakePhoto={takePhoto}
            onDone={close}
            onBack={() => goTo(index - 1)}
          />
        </Animated.View>
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space[16] }]}>
            <View style={styles.topRow}>
              {/* Pendant la transition, c'est la photo animée (plus bas) qui occupe cette place. */}
              <Image source={recipe.image} style={[styles.thumb, !settled && styles.hidden]} />
              <Animated.View style={{ opacity: contentOpacity }}>
                <IconButton icon="close" accessibilityLabel="Quitter le mode étape par étape" onPress={close} />
              </Animated.View>
            </View>

            <Animated.View style={[styles.step, { opacity: contentOpacity }]}>
              {/* Le compteur reste en place ; seule l'étape glisse quand on change d'étape. */}
              <View style={styles.number}>
                <AppText style={styles.numberText} color={color.textOnBrandPrimary}>
                  {`${index + 1}/${recipe.steps.length}`}
                </AppText>
              </View>
              <Animated.View style={[styles.step, { opacity: enter, transform: [{ translateX }] }]}>
                <AppText style={styles.instruction} color={color.textOnBrandPrimary}>
                  {step.text}
                </AppText>
                {/* Lancé, le minuteur rejoint la pastille du bas ; il revient s'il est arrêté depuis la sheet. */}
                {step.timer !== undefined && !timer && (
                  <View ref={cardRef}>
                    <TimerCard remaining={step.timer} running={false} onToggle={() => startTimer(step.timer!)} />
                  </View>
                )}
              </Animated.View>
            </Animated.View>
          </ScrollView>

          <Animated.View
            style={[styles.bottomRow, { paddingBottom: insets.bottom + space[24], opacity: contentOpacity }]}>
            <View style={styles.nav}>
              <RoundButton
                icon="magic"
                label="Modifier avec l’IA"
                onPress={() => setToast('La modification avec l’IA arrivera dans une prochaine version')}
              />
              {nextTimer && (
                <View ref={chipRef}>
                  <Animated.View style={flying && { opacity: chipOpacity }}>
                    <TimerChip
                      count={timers.length}
                      remaining={nextTimer.remaining}
                      onPress={() => setTimersOpen(true)}
                    />
                  </Animated.View>
                </View>
              )}
            </View>
            <View style={styles.nav}>
              <RoundButton
                icon="caretLeft"
                label="Étape précédente"
                disabled={index === 0}
                onPress={() => goTo(index - 1)}
              />
              <RoundButton icon="caretRight" label="Étape suivante" onPress={() => goTo(index + 1)} />
            </View>
          </Animated.View>
        </>
      )}

      {!settled && (
        <Animated.Image
          source={recipe.image}
          style={[
            styles.flyingPhoto,
            {
              left: lerp(from.px, space[16]),
              top: lerp(from.py, insets.top + space[16]),
              width: lerp(from.ps, THUMB),
              height: lerp(from.ps, THUMB),
              borderRadius: lerp(radius.xl, radius.md),
            },
          ]}
        />
      )}

      {flying && (
        <FlyingCard flight={flight} from={flying.from} to={flying.to ?? flying.from} remaining={flying.remaining} />
      )}

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        style={[styles.floating, { bottom: BOTTOM_ROW + insets.bottom }]}
      />

      <TimerSheet visible={timersOpen} onClose={() => setTimersOpen(false)} timers={timers} />
    </Animated.View>
  );
}

/** La carte minuteur pendant son trajet : son contenu s'efface tandis qu'elle prend la forme de la pastille. */
type FlyingCardProps = { flight: Animated.Value; from: Rect; to: Rect; remaining: number };

function FlyingCard({ flight, from, to, remaining }: FlyingCardProps) {
  const lerp = (a: number, b: number) => flight.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  const fade = flight.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: 'clamp' });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flyingCard,
        {
          left: lerp(from.x, to.x),
          top: lerp(from.y, to.y),
          width: lerp(from.width, to.width),
          height: lerp(from.height, to.height),
          borderRadius: lerp(radius.lg, to.height / 2),
        },
      ]}>
      <Animated.View style={{ width: from.width, opacity: fade }}>
        <TimerCard remaining={remaining} running={false} onToggle={() => {}} />
      </Animated.View>
    </Animated.View>
  );
}

/** Figma : boutons ronds blancs 48 px, icône orange (« CTA/ Round/ Light »). */
function RoundButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Tappable
      feedback="surface"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.round, disabled && styles.disabled]}>
      <Icon name={icon} color={color.actionSecondaryIcon} />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: color.bgBrandPage,
  },
  hidden: {
    opacity: 0,
  },
  flyingPhoto: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: color.borderPhoto,
  },
  glow: {
    position: 'absolute',
    left: 0,
    transformOrigin: 'top left',
  },
  content: {
    gap: space[32],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: color.borderPhoto,
  },
  step: {
    gap: space[32],
  },
  number: {
    alignSelf: 'flex-start',
    minWidth: 64,
    height: 40,
    paddingHorizontal: space[12],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.textOnBrandPrimary,
    borderRadius: 40,
  },
  // Figma 461:3266 : « 3/6 » en Medium 20.
  numberText: {
    ...text.stat,
    fontSize: 20,
    lineHeight: 24,
  },
  instruction: {
    fontSize: 24,
    lineHeight: 32,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
  },
  nav: {
    flexDirection: 'row',
    gap: space[8],
  },
  round: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
  },
  disabled: {
    opacity: 0.4,
  },
  flyingCard: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: color.controlSelectedBg,
  },
  floating: {
    position: 'absolute',
    left: space[16],
    right: space[16],
  },
});
