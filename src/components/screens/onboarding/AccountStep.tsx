import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
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
  taken: 'Ce pseudo n’est pas disponible.',
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

/** La carte dans l'image du badge (Figma 1013:17426), en px de la maquette : c'est elle seule qui brille. */
const CARD = { x: 140.1, y: 239.3, width: 178, height: 110, radius: 9.6 };
/** Un passage du reflet, de bas en haut, puis une pause avant le suivant. */
const SHINE_MS = 1400;
const SHINE_PAUSE = 2200;

/**
 * Le badge descend à l'arrivée avec un petit rebond, comme un badge qu'on accroche, puis reste en place ; un reflet
 * passe en boucle sur la carte, de bas en haut. Fixe et sans reflet si « Réduire les animations » est activé.
 */
function Badge({ width }: { width: number }) {
  const scale = width / BADGE_ART.width;
  const height = BADGE_ART.height * scale;
  const reduceMotion = useReduceMotion();
  const drop = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      drop.setValue(1);
      return;
    }
    drop.setValue(0);
    shine.setValue(0);
    const fall = Animated.spring(drop, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true });
    // Le reflet commence et finit hors de la carte : le retour au départ de chaque tour ne se voit pas.
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.delay(SHINE_PAUSE),
        Animated.timing(shine, {
          toValue: 1,
          duration: SHINE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    fall.start();
    sweep.start();
    return () => {
      fall.stop();
      sweep.stop();
    };
  }, [reduceMotion, drop, shine]);

  const card = {
    left: CARD.x * scale,
    top: CARD.y * scale,
    width: CARD.width * scale,
    height: CARD.height * scale,
    borderRadius: CARD.radius * scale,
  };
  const band = card.height;
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
        source={require('@/assets/images/onboarding/badge.png')}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ width, height }}
      />
      {!reduceMotion && (
        <View pointerEvents="none" style={[styles.card, card]}>
          <Animated.View
            style={{
              height: band,
              transform: [{ translateY: shine.interpolate({ inputRange: [0, 1], outputRange: [card.height, -band] }) }],
            }}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      )}
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
  card: {
    position: 'absolute',
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
