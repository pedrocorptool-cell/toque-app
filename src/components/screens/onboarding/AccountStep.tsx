import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText, BrandField, Button, TextButton } from '@/components/ui';
import { isPseudo } from '@/data/profile';
import { JoinError, type JoinErrorKind } from '@/data/space';
import { color, font, space } from '@/theme/tokens';

export type AccountMode = 'create' | 'login';

/** Figma 1013:17424 : le badge Toqué, 327 × 236. */
const BADGE = { width: 327, height: 236 };

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
  const badgeWidth = Math.min(BADGE.width, width - space[16] * 2);

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
          <Image
            source={require('@/assets/images/onboarding/badge.png')}
            style={{ width: badgeWidth, height: (badgeWidth * BADGE.height) / BADGE.width }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
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
