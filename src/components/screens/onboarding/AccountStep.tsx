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
import Svg, { Ellipse } from 'react-native-svg';

import { AppText, BrandField, Button, TextButton, useReduceMotion } from '@/components/ui';
import { isPseudo } from '@/data/profile';
import { JoinError, type JoinErrorKind } from '@/data/space';
import { color, font, space } from '@/theme/tokens';

export type AccountMode = 'create' | 'login';

/** Figma 1044:17842 : l'illustration, une carte Toqué inclinée qui flotte au-dessus de son ombre, 361 × 208. */
const ART = {
  width: 361,
  height: 208,
  card: { image: require('@/assets/images/onboarding/badge-card.png'), x: 61, y: 0.5, width: 237.5, height: 195 },
  shadow: { x: 36, y: 178.7, width: 289, height: 34 },
};

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
  // Réduite sur les écrans plus étroits que la maquette.
  const artScale = Math.min(1, (width - space[16] * 2) / ART.width);

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
          <FloatingCard scale={artScale} />
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
            <Button
              block
              variant="secondary"
              label={busy ? 'Vérification…' : copy.submit}
              disabled={busy || !pseudo.trim()}
              onPress={submit}
            />
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
      </View>
    </KeyboardAvoidingView>
  );
}

/** Un aller-retour de flottement : la carte monte et redescend, son ombre se resserre quand elle s'éloigne. */
const FLOAT_MS = 3200;
const FLOAT_STEPS = 24;
const FLOAT_INPUT = Array.from({ length: FLOAT_STEPS + 1 }, (_, i) => i / FLOAT_STEPS);
/** Un tour de sinus, de 0 à 0 : la boucle se raccorde sans à-coup, en position comme en vitesse. */
const FLOAT_SINE = FLOAT_INPUT.map((t) => Math.sin(2 * Math.PI * t));
// Sur le web, une boucle « native » ne joue qu'un tour : on y anime en JS.
const NATIVE = Platform.OS !== 'web';

/**
 * Comme les autres illustrations de l'onboarding : la carte tombe sur son ombre avec un petit rebond, puis flotte en
 * boucle, en montant et en se penchant un peu, pendant que son ombre se resserre. Tout le flottement suit une seule
 * horloge en boucle native. Immobile, telle que dans Figma, si « Réduire les animations » est activé.
 */
function FloatingCard({ scale }: { scale: number }) {
  const reduceMotion = useReduceMotion();
  const drop = useRef(new Animated.Value(0)).current;
  const clock = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      drop.setValue(1);
      clock.setValue(0);
      return;
    }
    drop.setValue(0);
    clock.setValue(0);
    const fall = Animated.spring(drop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: NATIVE });
    const float = Animated.loop(
      Animated.timing(clock, { toValue: 1, duration: FLOAT_MS, easing: Easing.linear, useNativeDriver: NATIVE }),
    );
    fall.start();
    // Le flottement commence une fois la carte posée.
    const timer = setTimeout(() => float.start(), 900);
    return () => {
      clearTimeout(timer);
      fall.stop();
      float.stop();
    };
  }, [reduceMotion, drop, clock]);

  const box = (layer: { x: number; y: number; width: number; height: number }) => ({
    position: 'absolute' as const,
    left: layer.x * scale,
    top: layer.y * scale,
    width: layer.width * scale,
    height: layer.height * scale,
  });
  const lift = clock.interpolate({ inputRange: FLOAT_INPUT, outputRange: FLOAT_SINE });
  const { card, shadow } = ART;

  return (
    <View style={{ width: ART.width * scale, height: ART.height * scale }}>
      <Animated.View
        style={[
          box(shadow),
          {
            opacity: drop.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [
              { scaleX: drop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
              // En haut de son flottement, la carte est plus loin : l'ombre rétrécit.
              { scale: lift.interpolate({ inputRange: [-1, 1], outputRange: [1.05, 0.95] }) },
            ],
          },
        ]}>
        {/* Figma : ellipse noire à 20 %. */}
        <Svg width="100%" height="100%" viewBox={`0 0 ${shadow.width} ${shadow.height}`} preserveAspectRatio="none">
          <Ellipse
            cx={shadow.width / 2}
            cy={shadow.height / 2}
            rx={shadow.width / 2}
            ry={shadow.height / 2}
            fill="#000"
            fillOpacity={0.2}
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          box(card),
          {
            opacity: drop.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [
              { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-120 * scale, 0] }) },
              { translateY: lift.interpolate({ inputRange: [-1, 1], outputRange: [5 * scale, -5 * scale] }) },
              { rotate: lift.interpolate({ inputRange: [-1, 1], outputRange: ['1.5deg', '-1.5deg'] }) },
            ],
          },
        ]}>
        <Image
          source={card.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{ width: card.width * scale, height: card.height * scale }}
        />
      </Animated.View>
    </View>
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
  // Figma : le champ et le bouton à 16 px l'un de l'autre, le message d'erreur entre les deux.
  fieldBlock: {
    alignSelf: 'stretch',
    gap: space[16],
  },
  error: {
    textAlign: 'center',
  },
  bottom: {
    alignItems: 'center',
    paddingHorizontal: space[16],
  },
});
