import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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

const COPY: Record<AccountMode, { title: string; message: string; switch: string; submit: string }> = {
  // Figma 748:6064
  create: {
    title: 'Crée ton espace Toqué',
    message: 'Choisis un pseudo qui claque et retiens-le pour tes futures connexions Toqué.',
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
  taken: 'Ce pseudo est déjà pris. Choisis-en un autre, ou connecte-toi si c’est le tien.',
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

/** Balancement au repos : ±2°, un aller-retour en 3,6 s. L'élan de l'arrivée ajoute jusqu'à 4° qui s'éteignent. */
const SWAY = 2;
const PERIOD = 3600;
const KICK = 4;
const KICK_MS = 4000;

// Courbes échantillonnées pour `interpolate` : tout le mouvement est calculé côté natif, sans relais JS entre deux
// étapes (c'était la cause des à-coups).
const STEPS = 48;
const T = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);
/** Un tour de sinus : finit comme il commence, en position et en vitesse, donc la boucle ne se voit pas. */
const SINE = T.map((t) => SWAY * Math.sin(2 * Math.PI * t));
/** L'élan, en phase avec le sinus (même période), amorti jusqu'à 0 en douceur. */
const KICK_CURVE = T.map((t) => {
  const ms = t * KICK_MS;
  return KICK * Math.exp((-2.5 * ms) / KICK_MS) * (1 - t) ** 2 * Math.sin((2 * Math.PI * ms) / PERIOD);
});

/**
 * Le badge descend à l'arrivée avec un petit rebond, comme un badge qu'on accroche, puis se balance au bout de ses
 * cordons : un premier élan amorti, puis un léger va-et-vient continu. Il pivote en haut au centre, où les cordons
 * partent. Fixe si « Réduire les animations » est activé.
 */
function Badge({ width }: { width: number }) {
  const height = (width * BADGE_ART.height) / BADGE_ART.width;
  const reduceMotion = useReduceMotion();
  const drop = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const kick = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      drop.setValue(1);
      sway.setValue(0);
      kick.setValue(1);
      return;
    }
    drop.setValue(0);
    sway.setValue(0);
    kick.setValue(0);
    // Trois animations natives lancées ensemble : la boucle du sinus et l'élan partagent la même horloge.
    const animations = [
      Animated.spring(drop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(sway, { toValue: 1, duration: PERIOD, easing: Easing.linear, useNativeDriver: true }),
      ),
      Animated.timing(kick, { toValue: 1, duration: KICK_MS, easing: Easing.linear, useNativeDriver: true }),
    ];
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [reduceMotion, drop, sway, kick]);

  const swing = Animated.add(
    sway.interpolate({ inputRange: T, outputRange: SINE }),
    kick.interpolate({ inputRange: T, outputRange: KICK_CURVE }),
  );
  const rotate = swing.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] });
  return (
    <Animated.Image
      source={require('@/assets/images/onboarding/badge.png')}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      style={{
        width,
        height,
        opacity: drop.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }),
        // Pivot en haut au centre : on remonte de la moitié de la hauteur, on tourne, puis on redescend.
        transform: [
          { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.4, 0] }) },
          { translateY: -height / 2 },
          { rotate },
          { translateY: height / 2 },
        ],
      }}
    />
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
    paddingHorizontal: space[32],
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
