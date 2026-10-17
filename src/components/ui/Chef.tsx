import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';

/** Figma : « Bouton/ Toqué Chef » — accès à l'offre premium depuis la home. */
export function ChefButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name="flame" color={color.premiumText} />
      <AppText color={color.premiumText}>Toqué Chef</AppText>
    </Pressable>
  );
}

/** Figma : « Tag Chef » — signale une fonctionnalité premium dans un menu. */
export function ChefTag() {
  return (
    <View style={styles.tag}>
      <Icon name="flame" size={14} color={color.premiumText} />
      <AppText variant="badge" color={color.premiumText}>
        Toqué Chef
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[12],
    borderRadius: radius.pill,
    backgroundColor: color.premiumBg,
  },
  pressed: {
    opacity: 0.8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[4],
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: color.premiumBg,
  },
});
