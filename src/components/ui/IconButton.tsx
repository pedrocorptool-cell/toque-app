import { StyleSheet } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { color, radius, shadow, space } from '@/theme/tokens';

import { Tappable } from './Tappable';

type Variant = 'primary' | 'surface' | 'onBrand' | 'plain';
type Size = 'sm' | 'md' | 'lg';

type IconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  /**
   * primary : fond orange (« CTA/ Round/ Lite » et « Light »)
   * surface : fond blanc (« CTA/ Round/ Dark »)
   * onBrand : fond translucide sur fond brun (« Bouton/ navigation », « CTA/ Navigation »)
   * plain : sans fond (« Bouton/ navigation » Clair)
   */
  variant?: Variant;
  /** sm 32 px · md 40 px · lg 48 px */
  size?: Size;
};

const SIZE = { sm: 32, md: 40, lg: 48 } as const;

const BG: Record<Variant, string> = {
  primary: color.actionPrimaryBg,
  surface: color.bgSurface,
  onBrand: color.actionIconBg,
  plain: 'transparent',
};

const ICON: Record<Variant, string> = {
  primary: color.actionPrimaryText,
  surface: color.textPrimary,
  onBrand: color.textOnBrandPrimary,
  plain: color.textPrimary,
};

/** Bouton rond icône seule. Zone tactile ≥ 40 px (consigne Figma). */
export function IconButton({ icon, accessibilityLabel, onPress, variant = 'onBrand', size = 'md' }: IconButtonProps) {
  const dim = SIZE[size];
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={size === 'sm' ? space[4] : 0}
      // Sans fond, l'icône seule s'estompe ; avec un fond, il fonce d'un cran.
      feedback={variant === 'plain' ? 'opacity' : 'surface'}
      style={[styles.base, { width: dim, height: dim, backgroundColor: BG[variant] }]}>
      <Icon name={icon} size={size === 'sm' ? 16 : 24} color={ICON[variant]} />
    </Tappable>
  );
}

/** Figma : « Bouton/ FAB » — 56 px, halo orange. */
export function Fab({
  onPress,
  accessibilityLabel = 'Ajouter une recette',
}: {
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      feedback="surface"
      style={[styles.base, styles.fab]}>
      <Icon name="plus" color={color.actionPrimaryText} />
    </Tappable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  fab: {
    width: 56,
    height: 56,
    ...shadow.fab,
  },
});
