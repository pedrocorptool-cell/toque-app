import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BottomSheet, Button, IconButton } from '@/components/ui';
import { color, font, radius, space } from '@/theme/tokens';

/** Bornes du réglage des parts, les mêmes que sur la fiche recette. */
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 12;

type ServingsSheetProps = {
  visible: boolean;
  onClose: () => void;
  initial: number;
  onSave: (count: number) => void;
};

/** Figma : « Sheet/Parts » — nombre de parts personnalisé, réglé au moins / plus. */
export function ServingsSheet({ visible, onClose, initial, onSave }: ServingsSheetProps) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    if (visible) setCount(initial);
  }, [visible, initial]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      closable
      title="Parts par défaut"
      footer={<Button block label="Enregistrer" onPress={() => onSave(count)} />}>
      <View style={styles.card}>
        <IconButton
          icon="minus"
          variant="primary"
          size="lg"
          accessibilityLabel="Diminuer les parts"
          onPress={() => setCount(Math.max(MIN_SERVINGS, count - 1))}
        />
        <View style={styles.quantity} accessibilityLiveRegion="polite">
          <AppText style={styles.count}>{count}</AppText>
          <AppText variant="label" color={color.textSecondary}>
            {count > 1 ? 'parts' : 'part'}
          </AppText>
        </View>
        <IconButton
          icon="plus"
          variant="primary"
          size="lg"
          accessibilityLabel="Augmenter les parts"
          onPress={() => setCount(Math.min(MAX_SERVINGS, count + 1))}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[24],
    padding: space[24],
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  quantity: {
    width: 96,
    alignItems: 'center',
  },
  count: {
    fontFamily: font.medium,
    fontSize: 28,
    lineHeight: 34,
  },
});
