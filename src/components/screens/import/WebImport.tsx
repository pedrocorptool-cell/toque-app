import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText, Button } from '@/components/ui';
import { normalizeUrl } from '@/data/imports';
import { color, radius, space, text } from '@/theme/tokens';

/** Hors maquette : champ de lien, bouton « Coller » et CTA d'import. */
export function WebImport({ onImport }: { onImport: (url: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const submit = (input = value) => {
    const url = normalizeUrl(input);
    if (url) onImport(url);
    else setError(true);
  };

  const paste = async () => {
    const pasted = (await Clipboard.getStringAsync().catch(() => '')).trim();
    if (!pasted) return;
    setValue(pasted);
    setError(false);
  };

  return (
    <>
      <AppText color={color.textSecondary}>
        Colle le lien d’une recette trouvée sur un blog ou un site de cuisine, Toqué s’occupe du reste.
      </AppText>

      <View style={styles.block}>
        <View style={[styles.field, error && styles.fieldError]}>
          <Icon name="link" size={16} color={color.textSecondary} />
          <TextInput
            value={value}
            onChangeText={(v) => {
              setValue(v);
              setError(false);
            }}
            onSubmitEditing={() => submit()}
            placeholder="https://"
            placeholderTextColor={color.textSecondary}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="go"
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            onPress={paste}
            hitSlop={space[8]}
            style={({ pressed }) => [styles.paste, pressed && styles.pressed]}>
            <Icon name="clipboard" size={16} color={color.actionSecondaryIcon} />
            <AppText variant="label">Coller</AppText>
          </Pressable>
        </View>
        {error && (
          <AppText variant="label" color={color.feedbackDanger}>
            Ce lien ne ressemble pas à une adresse web.
          </AppText>
        )}
      </View>

      <Button block label="Importer la recette" disabled={!value.trim()} onPress={() => submit()} />
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: space[8],
  },
  field: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.bgSurface,
    backgroundColor: color.bgSurface,
  },
  fieldError: {
    borderColor: color.feedbackDanger,
  },
  input: {
    ...text.body,
    flex: 1,
    height: '100%',
    padding: 0,
    color: color.textPrimary,
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  paste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  pressed: {
    opacity: 0.7,
  },
});
