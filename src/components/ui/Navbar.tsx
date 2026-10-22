import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabIcon, type TabIconName } from '@/components/icons/TabIcon';
import { color, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { useReduceMotion } from './useReduceMotion';

const TABS: Record<string, { label: string; icon: TabIconName }> = {
  index: { label: 'Recettes', icon: 'book' },
  liste: { label: 'Liste', icon: 'basket' },
  profil: { label: 'Profil', icon: 'profile' },
};

/** Figma : « Navbar » (Recettes / Liste / Profil), branchée comme barre d'onglets. */
export function Navbar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  // Compteur de clics par onglet : l'icône se redessine quand on arrive sur son onglet en le touchant.
  const [plays, setPlays] = useState<Record<string, number>>({});
  return (
    <View style={[styles.bar, { paddingBottom: space[8] + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (focused || event.defaultPrevented) return;
              setPlays((p) => ({ ...p, [route.key]: (p[route.key] ?? 0) + 1 }));
              navigation.navigate(route.name, route.params);
            }}
            style={styles.item}>
            <TabIcon
              name={tab.icon}
              color={focused ? color.actionSecondaryIcon : color.textSecondary}
              play={plays[route.key] ?? 0}
              reduceMotion={reduceMotion}
            />
            <AppText variant="label" color={focused ? color.textPrimary : color.textSecondary}>
              {tab.label}
            </AppText>
          </Pressable>
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
