import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Tappable } from './Tappable';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  /** Prend toute la largeur disponible (CTA de bas de bottom sheet). */
  block?: boolean;
  disabled?: boolean;
  /** `secondary` : blanc, libellé orange, sur les fonds bruns (écran de fin du mode étape). */
  variant?: 'primary' | 'secondary';
};

/** Figma : « CTA/ Primary » (Default / Pressed). */
export function Button({ label, onPress, icon, block, disabled, variant = 'primary' }: ButtonProps) {
  const secondary = variant === 'secondary';
  const tint = secondary ? color.actionSecondaryIcon : color.actionPrimaryText;
  return (
    <Tappable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      feedback="surface"
      style={[
        styles.base,
        block && styles.block,
        { backgroundColor: secondary ? color.bgSurface : color.actionPrimaryBg },
        disabled && styles.disabled,
      ]}>
      {icon && (
        <View>
          <Icon name={icon} size={block ? 16 : 24} color={tint} />
        </View>
      )}
      <AppText variant="button" color={tint}>
        {label}
      </AppText>
    </Tappable>
  );
}

type TextButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  /** `onBrand` : en blanc, sur les fonds bruns. */
  tone?: 'default' | 'danger' | 'onBrand';
  /** `small` : en 14 px, comme le texte qu'il accompagne (toasts). */
  size?: 'default' | 'small';
};

/** Figma : « CTA/ Secondary » — action texte avec icône optionnelle. */
export function TextButton({ label, onPress, icon, tone = 'default', size = 'default' }: TextButtonProps) {
  const tint = { default: color.textPrimary, danger: color.feedbackDanger, onBrand: color.textOnBrandPrimary }[tone];
  return (
    <Tappable accessibilityRole="button" onPress={onPress} hitSlop={space[8]} style={styles.text}>
      {icon && <Icon name={icon} color={tint} />}
      <AppText variant={size === 'small' ? 'label' : 'button'} color={tint}>
        {label}
      </AppText>
    </Tappable>
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
});
