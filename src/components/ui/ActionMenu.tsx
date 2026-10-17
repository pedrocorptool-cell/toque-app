import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { ChefTag } from './Chef';

export type ActionItem = {
  label: string;
  icon: IconName;
  onPress?: () => void;
  danger?: boolean;
  premium?: boolean;
};

/** Figma : « Menu/ Actions » — menu « … » de la page recette. */
export function ActionMenu({ items }: { items: ActionItem[] }) {
  return (
    <View style={styles.menu} accessibilityRole="menu">
      {items.map((item) => {
        const tint = item.danger ? color.feedbackDanger : color.textPrimary;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="menuitem"
            onPress={item.onPress}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <Icon name={item.icon} color={tint} />
            <AppText color={tint}>{item.label}</AppText>
            {item.premium && <ChefTag />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    width: 291,
    gap: space[16],
    padding: space[16],
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  pressed: {
    opacity: 0.6,
  },
});
