import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Tappable } from './Tappable';

/** Figma : « Bouton/ Toqué Chef » — accès à l'offre premium depuis la home. */
export function ChefButton({ onPress }: { onPress?: () => void }) {
  return (
    <Tappable feedback="surface" accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Icon name="flame" color={color.premiumText} />
      <AppText color={color.premiumText}>Toqué Chef</AppText>
    </Tappable>
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
