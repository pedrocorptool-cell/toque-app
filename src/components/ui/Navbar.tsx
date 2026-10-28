import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { color, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Tappable } from './Tappable';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Recettes', icon: 'book' },
  liste: { label: 'Liste', icon: 'basket' },
  profil: { label: 'Profil', icon: 'profile' },
};

/** Figma : « Navbar » (Recettes / Liste / Profil), branchée comme barre d'onglets. */
export function Navbar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: space[8] + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        return (
          <Tappable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={styles.item}>
            <Icon name={tab.icon} color={focused ? color.actionSecondaryIcon : color.textSecondary} />
            <AppText variant="label" color={focused ? color.textPrimary : color.textSecondary}>
              {tab.label}
            </AppText>
          </Tappable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: space[8],
    paddingHorizontal: space[24],
    paddingTop: space[8],
    borderTopWidth: 1,
    borderTopColor: color.bgPage,
    backgroundColor: color.bgSurface,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[4],
    paddingVertical: space[8],
  },
});
