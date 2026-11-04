import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { AppText, BottomSheet, Button, TextButton } from '@/components/ui';
import { color, radius, space, text } from '@/theme/tokens';

type StepTimerSheetProps = {
  visible: boolean;
  /** Durée du minuteur de l'étape, en secondes ; absente pour en ajouter un. */
  initial?: number;
  onClose: () => void;
  onSave: (seconds: number) => void;
  onRemove: () => void;
};

const UNITS = [
  { label: 'Heures', seconds: 3600, max: 99 },
  { label: 'Minutes', seconds: 60, max: 59 },
  { label: 'Secondes', seconds: 1, max: 59 },
] as const;

const split = (total = 0) => [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
const two = (n: number) => (n ? String(n).padStart(2, '0') : '');

/** Figma « Ajouter un minuteur » / « Modifier le minuteur » : heures, minutes, secondes. */
export function StepTimerSheet({ visible, initial, onClose, onSave, onRemove }: StepTimerSheetProps) {
  const [values, setValues] = useState(['', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  // Références stables : une nouvelle fonction à chaque rendu ferait reprendre le focus au champ sur le web.
  const refs = useRef(UNITS.map((_, i) => (el: TextInput | null) => void (inputs.current[i] = el))).current;
  useEffect(() => {
    if (visible) setValues(split(initial).map(two));
  }, [visible, initial]);

  const total = values.reduce((sum, v, i) => sum + Math.min(Number(v) || 0, UNITS[i].max) * UNITS[i].seconds, 0);
  const editing = initial !== undefined;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={editing ? 'Modifier le minuteur' : 'Ajouter un minuteur'}
      footer={
        <View style={styles.footer}>
          <Button
            block
            label={editing ? 'Enregistrer' : 'Ajouter'}
            disabled={total === 0}
            onPress={() => onSave(total)}
          />
          {editing ? (
            <TextButton icon="trash" label="Supprimer" onPress={onRemove} />
          ) : (
            <TextButton label="Annuler" onPress={onClose} />
          )}
        </View>
      }>
      <View style={styles.fields}>
        {UNITS.map((unit, i) => (
          <View key={unit.label} style={styles.field}>
            <AppText color={color.textSecondary} style={styles.center} nativeID={`minuteur-${unit.label}`}>
              {unit.label}
            </AppText>
            <TextInput
              value={values[i]}
              ref={refs[i]}
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, '').slice(0, 2);
                setValues((list) => list.map((x, j) => (j === i ? digits : x)));
                // Deux chiffres saisis : on passe tout seul au champ suivant.
                if (digits.length === 2) inputs.current[i + 1]?.focus();
              }}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="00"
              placeholderTextColor={color.textSecondary}
              accessibilityLabel={unit.label}
              accessibilityLabelledBy={`minuteur-${unit.label}`}
              selectTextOnFocus
              style={styles.input}
            />
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fields: {
    flexDirection: 'row',
    gap: space[16],
  },
  field: {
    flex: 1,
    gap: space[12],
  },
  center: {
    textAlign: 'center',
  },
  input: {
    ...text.body,
    height: 48,
    textAlign: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderDefault,
    backgroundColor: color.bgSurface,
    color: color.textPrimary,
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  footer: {
    gap: space[24],
    alignItems: 'center',
  },
});
