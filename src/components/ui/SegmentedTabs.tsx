import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

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
  const index = options.findIndex((o) => o.value === value);
  const [width, setWidth] = useState(0);
  // La pastille blanche glisse sous l'onglet choisi.
  const position = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.timing(position, {
      toValue: index,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, position]);

  const tabWidth = (width - space[4] * 2) / options.length;

  return (
    <View style={styles.track} accessibilityRole="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            { width: tabWidth, transform: [{ translateX: Animated.multiply(position, tabWidth) }] },
          ]}
        />
      )}
      {options.map((option) => {
        const active = option.value === value;
        const tint = active ? color.textPrimary : color.textOnBrandPrimary;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={styles.tab}>
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
    backgroundColor: color.bgBrandField,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    borderRadius: radius.pill,
  },
  indicator: {
    position: 'absolute',
    top: space[4],
    bottom: space[4],
    left: space[4],
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
    ...shadow.tab,
  },
});
