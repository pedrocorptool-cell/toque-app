import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, Tappable } from '@/components/ui';
import { color, radius, space } from '@/theme/tokens';

/** Figma « Bottom Sheet/ Import » : carte blanche d'un mode d'import. */
export function ImportOption({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Tappable feedback="card" accessibilityRole="button" onPress={onPress} style={[styles.option, style]}>
      {children}
    </Tappable>
  );
}

/** Carte à icône orange et libellé sur une ligne (« Photo », « Lien Web »). */
export function IconOption({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <ImportOption onPress={onPress} style={styles.half}>
      <Icon name={icon} color={color.actionSecondaryIcon} />
      <AppText>{label}</AppText>
    </ImportOption>
  );
}

const styles = StyleSheet.create({
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  half: {
    flex: 1,
    height: 80,
    flexDirection: 'row',
    gap: space[8],
  },
});
