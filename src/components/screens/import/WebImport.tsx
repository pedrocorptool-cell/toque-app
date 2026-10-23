import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { normalizeUrl } from '@/data/imports';
import { color, radius, space, text } from '@/theme/tokens';

/** Figma « Bottom Sheet/ Enregistrer/ New » (622:16839) : phrase d'accroche, champ de lien et CTA d'import. Message d'erreur hors maquette. */
export function WebImport({ onImport }: { onImport: (url: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const submit = (input = value) => {
    const url = normalizeUrl(input);
    if (url) onImport(url);
    else setError(true);
  };

  return (
    <>
      <AppText color={color.textSecondary} style={styles.intro}>
        Colle ton lien ci-dessous, on s’occupe du reste !
      </AppText>

      <View style={styles.block}>
        <View style={[styles.field, error && styles.fieldError]}>
          <TextInput
            value={value}
            onChangeText={(v) => {
              setValue(v);
              setError(false);
            }}
            onSubmitEditing={() => submit()}
            placeholder="www.toque.fr"
            placeholderTextColor={color.textSecondary}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="go"
            style={styles.input}
          />
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
  intro: {
    textAlign: 'center',
  },
  block: {
    gap: space[8],
  },
  field: {
    height: 48,
    justifyContent: 'center',
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
    height: '100%',
    padding: 0,
    color: color.textPrimary,
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
});
