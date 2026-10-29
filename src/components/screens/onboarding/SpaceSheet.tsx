import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText, BottomSheet, Button } from '@/components/ui';
import { isToqueId } from '@/data/profile';
import { JoinError, type JoinErrorKind } from '@/data/space';
import { color, radius, space, text } from '@/theme/tokens';

type SpaceSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Rattache le téléphone à l'espace ; lève une `JoinError` si l'ID ne convient pas. */
  onCreate: (account: { name: string; toqueId: string }) => Promise<void>;
};

/**
 * Figma « Onbarding » (748:6064) : après la 3e étape, le pseudo et l'ID d'invitation donné par Pierre
 * rattachent le téléphone à son espace. Le format de l'ID est vérifié ici, son existence par la base.
 */
const MESSAGES: Record<JoinErrorKind | 'format', string> = {
  format: 'Cet ID ne ressemble pas à un ID Toqué, par exemple FolleCourgette#0001.',
  not_found: 'Cet ID n’existe pas. Vérifie les majuscules et les chiffres après le #.',
  too_many: 'Trop d’essais. Réessaie dans 15 minutes.',
  offline: 'Pas de connexion. Vérifie ton réseau et réessaie.',
  unknown: 'Impossible de rejoindre ton espace pour l’instant. Réessaie plus tard.',
};

export function SpaceSheet({ visible, onClose, onCreate }: SpaceSheetProps) {
  const [name, setName] = useState('');
  const [toqueId, setToqueId] = useState('');
  const [idError, setIdError] = useState<keyof typeof MESSAGES | null>(null);
  const [busy, setBusy] = useState(false);
  const idField = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) setIdError(null);
  }, [visible]);

  const submit = async () => {
    const id = toqueId.trim();
    if (busy || !name.trim()) return;
    if (!isToqueId(id)) return setIdError('format');
    setBusy(true);
    try {
      await onCreate({ name: name.trim(), toqueId: id });
    } catch (error) {
      setIdError(error instanceof JoinError ? error.kind : 'unknown');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} closable title="Crée ton espace Toqué">
      <AppText color={color.textSecondary} style={styles.message}>
        Choisis un pseudo qui claque et saisis l’ID d’invitation qui t’a été fourni
      </AppText>
      <View style={styles.fields}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ton pseudo Toqué"
          placeholderTextColor={color.textSecondary}
          accessibilityLabel="Ton pseudo Toqué"
          autoComplete="nickname"
          returnKeyType="next"
          onSubmitEditing={() => idField.current?.focus()}
          submitBehavior="submit"
          style={styles.field}
        />
        <TextInput
          ref={idField}
          value={toqueId}
          onChangeText={(value) => {
            setToqueId(value);
            if (idError) setIdError(null);
          }}
          placeholder="Ton ID Toqué"
          placeholderTextColor={color.textSecondary}
          accessibilityLabel="Ton ID Toqué"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
          style={[styles.field, idError && styles.fieldError]}
        />
        {idError && (
          <AppText variant="label" color={color.feedbackDanger} accessibilityLiveRegion="polite">
            {MESSAGES[idError]}
          </AppText>
        )}
      </View>
      <Button
        block
        label={busy ? 'Vérification…' : 'Continuer'}
        disabled={busy || !name.trim() || !toqueId.trim()}
        onPress={submit}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  message: {
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: space[24],
  },
  fields: {
    gap: space[16],
  },
  field: {
    ...text.body,
    height: 48,
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.bgSurface,
    backgroundColor: color.bgSurface,
    color: color.textPrimary,
    // Sur le web, le contour de focus du navigateur s'ajouterait au champ.
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  fieldError: {
    borderColor: color.feedbackDanger,
  },
});
