import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { color, radius, shadow, space } from '@/theme/tokens';

import { AppText } from './AppText';

type Option<T extends string> = { value: T; label: string; icon: IconName };

type SegmentedTabsProps<T extends string> = {
  options: readonly [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
};

/** Figma : « Tabs » — bascule Ingrédients / Recette de la page recette. */
export function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        const tint = active ? color.textPrimary : color.textOnBrandPrimary;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.tab, active && styles.tabActive]}>
            <Icon name={option.icon} color={active ? color.actionSecondaryIcon : tint} />
            <AppText color={tint}>{option.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 50,
    flexDirection: 'row',
    padding: space[4],
    borderRadius: radius.pill,
    backgroundColor: color.actionIconBg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: color.bgSurface,
    ...shadow.tab,
  },
});
