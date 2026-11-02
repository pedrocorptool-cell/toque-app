import { StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { color, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Fab } from './IconButton';
import { Tappable } from './Tappable';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Recettes', icon: 'book' },
  liste: { label: 'Liste', icon: 'basket' },
};

/**
 * Figma « Home » (essai) : Recettes, le bouton + au centre, Liste. Le profil s'ouvre depuis l'icône en haut de la
 * home : son onglet existe toujours mais n'a plus de place dans la barre.
 */
export function Navbar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabs = state.routes.map((route, index) => ({ route, index })).filter(({ route }) => TABS[route.name]);
  return (
    <View style={[styles.bar, { paddingBottom: space[8] + insets.bottom }]}>
      {tabs.map(({ route, index }, position) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const item = (
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
        if (position !== 0) return item;
        // Le + ouvre l'import sur la home, quel que soit l'onglet affiché.
        return [
          item,
          <View key="fab" style={styles.fab}>
            <Fab onPress={() => navigation.navigate('index', { importer: String(Date.now()) })} />
          </View>,
        ];
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[24],
    paddingTop: space[8],
    borderTopWidth: 1,
    borderTopColor: color.bgPage,
    backgroundColor: color.bgSurface,
  },
  fab: {
    alignSelf: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[4],
    paddingVertical: space[8],
  },
});
