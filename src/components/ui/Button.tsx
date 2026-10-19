import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  /** Prend toute la largeur disponible (CTA de bas de bottom sheet). */
  block?: boolean;
  disabled?: boolean;
};

/** Figma : « CTA/ Primary » (Default / Pressed). */
export function Button({ label, onPress, icon, block, disabled }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        block && styles.block,
        { backgroundColor: pressed ? color.actionPrimaryBgPressed : color.actionPrimaryBg },
        disabled && styles.disabled,
      ]}>
      {icon && (
        <View>
          <Icon name={icon} size={block ? 16 : 24} color={color.actionPrimaryText} />
        </View>
      )}
      <AppText variant="button" color={color.actionPrimaryText}>
        {label}
      </AppText>
    </Pressable>
  );
}

type TextButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  /** `onBrand` : en blanc, sur les fonds bruns. */
  tone?: 'default' | 'danger' | 'onBrand';
};

/** Figma : « CTA/ Secondary » — action texte avec icône optionnelle. */
export function TextButton({ label, onPress, icon, tone = 'default' }: TextButtonProps) {
  const tint = { default: color.textPrimary, danger: color.feedbackDanger, onBrand: color.textOnBrandPrimary }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={space[8]}
      style={({ pressed }) => [styles.text, pressed && styles.textPressed]}>
      {icon && <Icon name={icon} color={tint} />}
      <AppText variant="button" color={tint}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  block: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  textPressed: {
    opacity: 0.6,
  },
});
