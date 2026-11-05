import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { AppText, BrandField, Button, TextButton, useReduceMotion } from '@/components/ui';
import { isPseudo } from '@/data/profile';
import { JoinError, type JoinErrorKind } from '@/data/space';
import { color, font, space } from '@/theme/tokens';

export type AccountMode = 'create' | 'login';

/** Figma 1013:17463 : le cadre du badge Toqué, 327 × 236. */
const BADGE = { width: 327, height: 236 };
/** L'image du badge avec ses cordons (Figma 1013:17424), qui débordent du cadre jusqu'aux bords de l'écran. */
const BADGE_ART = { width: 452, height: 349 };
/** Hauteur des cordons au-dessus du cadre : elle déborde vers le haut sans pousser le reste de l'écran. */
const BADGE_OVERFLOW = BADGE_ART.height - BADGE.height;

const COPY: Record<AccountMode, { title: string; message: string; switch: string; submit: string }> = {
  // Figma 748:6064
  create: {
    title: 'Crée ton espace Toqué',
    message: 'Choisis un pseudo qui claque et retiens-le pour tes prochaines connexions Toqué.',
    switch: 'J’ai déjà un compte Toqué',
    submit: 'Continuer',
  },
  // Figma 1013:17485
  login: {
    title: 'Connecte-toi à Toqué',
    message: 'Saisis ton pseudo Toqué, on s’occupe de récupérer tes recettes !',
    switch: 'Créer un compte Toqué',
    submit: 'Me connecter',
  },
};

const MESSAGES: Record<JoinErrorKind, string> = {
  bad_pseudo: 'Ton pseudo doit faire 2 à 24 caractères : lettres, chiffres, espaces ou _ # . -',
  taken: 'Ce pseudo n’est pas disponible',
  not_found: 'Aucun compte Toqué à ce pseudo. Vérifie l’orthographe.',
  too_many: 'Trop d’essais. Réessaie dans 15 minutes.',
  offline: 'Pas de connexion. Vérifie ton réseau et réessaie.',
  unknown: 'Impossible de te connecter pour l’instant. Réessaie plus tard.',
};

type AccountStepProps = {
  mode: AccountMode;
  onModeChange: (mode: AccountMode) => void;
  /** Crée l'espace ou s'y connecte ; lève une `JoinError` si le pseudo ne convient pas. */
  onSubmit: (pseudo: string, mode: AccountMode) => Promise<void>;
};

/**
 * Figma « Onbarding » : après la 3e étape, un pseudo à retenir crée l'espace Toqué ou retrouve celui d'un autre
 * téléphone. Le format est vérifié ici, la disponibilité et l'existence par la base.
 */
export function AccountStep({ mode, onModeChange, onSubmit }: AccountStepProps) {
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState<JoinErrorKind | null>(null);
  const [busy, setBusy] = useState(false);
  const copy = COPY[mode];
  const { width } = useWindowDimensions();
  // Réduit avec le cadre de 327 px sur les écrans plus étroits que la maquette.
  const badgeScale = Math.min(1, (width - space[16] * 2) / BADGE.width);

  const submit = async () => {
    if (busy || !pseudo.trim()) return;
    if (!isPseudo(pseudo)) return setError('bad_pseudo');
    setBusy(true);
    try {
      await onSubmit(pseudo.trim().replace(/\s+/g, ' '), mode);
    } catch (e) {
      setError(e instanceof JoinError ? e.kind : 'unknown');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={styles.main}>
          <Badge width={BADGE_ART.width * badgeScale} />
          <View style={styles.texts}>
            <AppText color={color.textOnBrandPrimary} style={styles.title} accessibilityRole="header">
              {copy.title}
            </AppText>
            <AppText color={color.textOnBrandSecondary} style={styles.message}>
              {copy.message}
            </AppText>
          </View>
          <View style={styles.fieldBlock}>
            <BrandField
              value={pseudo}
              onChangeText={(value) => {
                setPseudo(value);
                if (error) setError(null);
              }}
              invalid={Boolean(error)}
              placeholder="Ton pseudo Toqué"
              accessibilityLabel="Ton pseudo Toqué"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              maxLength={24}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
            {error && (
              <AppText
                variant="label"
                color={color.textOnBrandPrimary}
                style={styles.error}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert">
                {MESSAGES[error]}
              </AppText>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TextButton
          tone="onBrand"
          label={copy.switch}
          onPress={() => {
            setError(null);
            onModeChange(mode === 'create' ? 'login' : 'create');
          }}
        />
        <Button
          block
          variant="secondary"
          label={busy ? 'Vérification…' : copy.submit}
          disabled={busy || !pseudo.trim()}
          onPress={submit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/** Calques du badge (Figma 1013:17424), en px de la maquette dans l'image de 452 × 349. */
const BADGE_LAYERS = {
  base: require('@/assets/images/onboarding/badge-base.png'),
  /** Les deux reflets obliques de la carte (Rectangles 72 et 73). */
  shine: { image: require('@/assets/images/onboarding/badge-shine.png'), x: 202.8, y: 239.3, width: 101, height: 110 },
  /** Les 14 étoiles de l'ID, qui se tapent une à une. */
  stars: { image: require('@/assets/images/onboarding/badge-stars.png'), x: 219.3, y: 299.6, width: 78, height: 4 },
};
const STAR_COUNT = 14;
/** La carte, où passent les reflets. */
const CARD = { x: 140.1, y: 239.3, width: 178, height: 110, radius: 9.6 };

/**
 * Un tour de 5,4 s sur une seule horloge (une boucle native d'un seul `timing` : enchaîner des étapes dans la boucle
 * ne la rejouait qu'une fois). Les étoiles se tapent, les reflets traversent la carte, puis les étoiles s'effacent.
 */
const CYCLE = 5400;
const at = (ms: number) => ms / CYCLE;
const TYPE = { from: at(300), to: at(1500) };
const SWEEP = { from: at(2000), to: at(3200) };
const ERASE = { from: at(4600), to: at(4900) };
// Une marche par étoile : l'ID se tape, il ne glisse pas.
const TYPE_INPUT = [0, TYPE.from];
const TYPE_OUTPUT = [0, 0];
for (let i = 1; i <= STAR_COUNT; i++) {
  const t = TYPE.from + ((TYPE.to - TYPE.from) * i) / STAR_COUNT;
  TYPE_INPUT.push(t - 0.0001, t);
  TYPE_OUTPUT.push((i - 1) / STAR_COUNT, i / STAR_COUNT);
}
TYPE_INPUT.push(1);
TYPE_OUTPUT.push(1);
/** Passage des reflets, accéléré puis freiné, échantillonné pour `interpolate`. */
const SWEEP_STEPS = 12;
const SWEEP_INPUT = [
  0,
  ...Array.from({ length: SWEEP_STEPS + 1 }, (_, i) => SWEEP.from + ((SWEEP.to - SWEEP.from) * i) / SWEEP_STEPS),
  1,
];
const SWEEP_OUTPUT = [
  0,
  ...Array.from({ length: SWEEP_STEPS + 1 }, (_, i) => {
    const t = i / SWEEP_STEPS;
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }),
  1,
];
// Sur le web, une boucle « native » ne joue qu'un tour : on y anime en JS.
const NATIVE = Platform.OS !== 'web';

/**
 * Comme les autres illustrations de l'onboarding : le badge descend avec un petit rebond, puis en boucle son ID se
 * tape étoile par étoile et ses reflets traversent la carte. Au repos (« Réduire les animations »), il est tel que
 * dans Figma.
 */
function Badge({ width }: { width: number }) {
  const scale = width / BADGE_ART.width;
  const height = BADGE_ART.height * scale;
  const reduceMotion = useReduceMotion();
  const drop = useRef(new Animated.Value(0)).current;
  const clock = useRef(new Animated.Value(0)).current;
  // Au repos (« Réduire les animations ») : l'ID et les reflets tels que dans Figma.
  const playing = !reduceMotion;

  useEffect(() => {
    if (reduceMotion) {
      drop.setValue(1);
      return;
    }
    drop.setValue(0);
    clock.setValue(0);
    const fall = Animated.spring(drop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: NATIVE });
    const loop = Animated.loop(
      Animated.timing(clock, { toValue: 1, duration: CYCLE, easing: Easing.linear, useNativeDriver: NATIVE }),
    );
    fall.start();
    // Le badge tombe avec un ID vide ; la boucle démarre quand il s'est posé.
    const timer = setTimeout(() => loop.start(), 700);
    return () => {
      clearTimeout(timer);
      fall.stop();
      loop.stop();
    };
  }, [reduceMotion, drop, clock]);

  const box = (layer: { x: number; y: number; width: number; height: number }) => ({
    position: 'absolute' as const,
    left: layer.x * scale,
    top: layer.y * scale,
    width: layer.width * scale,
    height: layer.height * scale,
  });
  const card = { ...box(CARD), borderRadius: CARD.radius * scale };
  const stars = BADGE_LAYERS.stars;
  const shine = BADGE_LAYERS.shine;
  const starsWidth = stars.width * scale;
  // Part de l'ID tapée : la fenêtre qui le montre s'ouvre de gauche à droite, l'image restant en place.
  const typed = clock.interpolate({ inputRange: TYPE_INPUT, outputRange: TYPE_OUTPUT });
  const hidden = typed.interpolate({ inputRange: [0, 1], outputRange: [-starsWidth, 0] });
  const sweep = clock.interpolate({ inputRange: SWEEP_INPUT, outputRange: SWEEP_OUTPUT });
  // Les reflets partent juste avant le bord gauche de la carte et sortent par le bord droit.
  const shineFrom = (CARD.x - shine.x - shine.width) * scale;
  const shineTo = (CARD.x + CARD.width - shine.x) * scale;

  return (
    <Animated.View
      style={{
        width,
        height,
        // Seul le cadre de la maquette compte dans la mise en page, comme dans Figma.
        marginTop: -BADGE_OVERFLOW * scale,
        opacity: drop.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.4, 0] }) }],
      }}>
      <Image
        source={BADGE_LAYERS.base}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ width, height }}
      />
      <Animated.View
        style={[
          box(stars),
          styles.clip,
          playing && {
            opacity: clock.interpolate({ inputRange: [0, ERASE.from, ERASE.to, 1], outputRange: [1, 1, 0, 0] }),
            transform: [{ translateX: hidden }],
          },
        ]}>
        <Animated.Image
          source={stars.image}
          style={[
            { width: starsWidth, height: stars.height * scale },
            playing && { transform: [{ translateX: Animated.multiply(hidden, -1) }] },
          ]}
        />
      </Animated.View>
      <View pointerEvents="none" style={[card, styles.clip]}>
        <Animated.Image
          source={shine.image}
          style={[
            box({ ...shine, x: shine.x - CARD.x, y: shine.y - CARD.y }),
            playing && {
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [shineFrom, shineTo],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: space[16],
    paddingVertical: space[24],
  },
  main: {
    alignItems: 'center',
    gap: space[40],
  },
  texts: {
    alignSelf: 'stretch',
    gap: space[16],
  },
  // Figma : Zalando Sans Regular 28 / 38 et 16 / 24, centrés.
  title: {
    fontFamily: font.regular,
    fontSize: 28,
    lineHeight: 38,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  clip: {
    overflow: 'hidden',
  },
  fieldBlock: {
    alignSelf: 'stretch',
    gap: space[8],
  },
  error: {
    textAlign: 'center',
  },
  bottom: {
    alignItems: 'center',
    gap: space[24],
    paddingHorizontal: space[16],
  },
});
