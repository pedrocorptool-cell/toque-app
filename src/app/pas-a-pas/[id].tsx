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

import { BlurGlow } from '@/components/art/BlurGlow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { TimerSheet } from '@/components/screens/TimerSheet';
import { AppText, IconButton, TimerCard, TimerChip, Toast } from '@/components/ui';
import { useRecipes } from '@/data/RecipesContext';
import { isDone, useTimers } from '@/data/TimersContext';
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
  const { width: screenWidth } = useWindowDimensions();
  const { recipes } = useRecipes();
  const { timers: allTimers, timerFor, toggle, setFocusedRecipeId } = useTimers();
  const insets = useSafeAreaInsets();
  const recipe = recipes.find((r) => r.id === id);

  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [timersOpen, setTimersOpen] = useState(false);

  // Comme sur la fiche : un minuteur de cette recette qui se termine ouvre la sheet, pas le dialogue global.
  useFocusEffect(
    useCallback(() => {
      setFocusedRecipeId(id ?? null);
      return () => setFocusedRecipeId(null);
    }, [id, setFocusedRecipeId]),
  );

  // Minuteurs lancés : regroupés dans une pastille parmi les actions du bas (le plus proche de sonner affiché).
  const timers = allTimers.filter((t) => t.recipeId === id).sort((x, y) => x.step - y.step);
  const nextTimer = [...timers].sort((x, y) => x.remaining - y.remaining)[0];

  // Un minuteur de la recette arrive à zéro : la sheet s'ouvre, comme sur la fiche.
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

  /** Quitter : la photo et le flou reviennent à leur place sur la fiche avant de fermer. */
  const close = useCallback(() => {
    if (!origin) return goBack(`/recette/${id}`);
    setSettled(false);
    Animated.timing(progress, {
      toValue: 0,
      duration: TRANSITION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(() => goBack(`/recette/${id}`));
  }, [origin, progress, id]);

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

  const step = recipe.steps[index];
  const last = recipe.steps.length - 1;
  const timer = timerFor(recipe.id, index);

  // Pendant le trajet, la pastille n'apparaît qu'à l'arrivée de la carte.
  const chipOpacity = flight.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0, 0, 1] });

  const startTimer = (seconds: number) => {
    // La pastille est déjà là : son compteur suffit, pas de trajet.
    if (timers.length) return toggle(recipe.id, index, seconds);
    cardRef.current?.measureInWindow((x, y, width, height) => {
      flight.setValue(0);
      setFlying({ from: { x, y, width, height }, remaining: seconds });
      toggle(recipe.id, index, seconds);
    });
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
    <View style={styles.screen}>
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
            opacity: progress,
            transform: [{ scaleX: lerp(screenWidth / GLOW_WIDTH, 1) }, { scaleY: lerp(from.bh / glowHeight, 1) }],
          },
        ]}>
        <BlurGlow source={recipe.image} width={GLOW_WIDTH} height={glowHeight} blur={blur.glow} />
      </Animated.View>

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space[16] }]}>
        <View style={styles.topRow}>
          {/* Pendant la transition, c'est la photo animée (plus bas) qui occupe cette place. */}
          <Image source={recipe.image} style={[styles.thumb, !settled && styles.hidden]} />
          <Animated.View style={{ opacity: contentOpacity }}>
            <IconButton icon="close" accessibilityLabel="Quitter le mode étape par étape" onPress={close} />
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: contentOpacity }}>
          <Animated.View style={[styles.step, { opacity: enter, transform: [{ translateX }] }]}>
            <View style={styles.number}>
              <AppText style={styles.numberText} color={color.textOnBrandPrimary}>
                {index + 1}
              </AppText>
            </View>
            <AppText style={styles.instruction} color={color.textOnBrandPrimary}>
              {step.text}
            </AppText>
            {/* Une fois lancé, le minuteur rejoint la pastille du bas ; il revient s'il est arrêté depuis la sheet. */}
            {step.timer !== undefined && !timer && (
              <View ref={cardRef}>
                <TimerCard remaining={step.timer} running={false} onToggle={() => startTimer(step.timer!)} />
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>

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

      {toast && (
        <View style={[styles.floating, { bottom: BOTTOM_ROW + insets.bottom }]}>
          <Toast message={toast} onClose={() => setToast(null)} />
        </View>
      )}

      <Animated.View style={[styles.bottomRow, { paddingBottom: insets.bottom + space[24], opacity: contentOpacity }]}>
        <View style={styles.nav}>
          <RoundButton
            icon="magic"
            label="Modifier avec l’IA"
            onPress={() => setToast('La modification avec l’IA arrivera dans une prochaine version')}
          />
          {nextTimer && (
            <View ref={chipRef}>
              <Animated.View style={flying && { opacity: chipOpacity }}>
                <TimerChip count={timers.length} remaining={nextTimer.remaining} onPress={() => setTimersOpen(true)} />
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
          <RoundButton
            icon="caretRight"
            label="Étape suivante"
            disabled={index === last}
            onPress={() => goTo(index + 1)}
          />
        </View>
      </Animated.View>

      <TimerSheet visible={timersOpen} onClose={() => setTimersOpen(false)} timers={timers} />
    </View>
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && styles.roundPressed, disabled && styles.disabled]}>
      <Icon name={icon} color={color.actionSecondaryIcon} />
    </Pressable>
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
    width: 64,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.textOnBrandPrimary,
    borderRadius: 40,
  },
  numberText: {
    ...text.stat,
    lineHeight: 28,
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
  roundPressed: {
    backgroundColor: color.bgPage,
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
