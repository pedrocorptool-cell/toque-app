import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { motion } from '@/theme/motion';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { useReduceMotion } from './useReduceMotion';

/** La coche grandit de 60 % à sa taille en 140 ms, sans rebond : un geste fréquent reste discret. */
const TICK_DURATION = 140;
const TICK_FROM = 0.6;

type CheckboxProps = {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label?: string;
};

/** Figma : « Checkbox » (Cochée / Non cochée). Filtres, liste de courses, enregistrement. */
export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  const reduceMotion = useReduceMotion();
  const tick = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const mounted = useRef(false);

  // Seulement quand on coche : une case déjà cochée à l'affichage ne s'anime pas.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!checked || reduceMotion) {
      tick.setValue(checked ? 1 : 0);
      return;
    }
    tick.setValue(0);
    Animated.timing(tick, {
      toValue: 1,
      duration: TICK_DURATION,
      easing: motion.easeOut,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange?.(!checked)}
      hitSlop={space[12]}
      style={styles.row}>
      {label && (
        <AppText style={styles.label} color={color.textSecondary}>
          {label}
        </AppText>
      )}
      <View style={styles.hit}>
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && (
            <Animated.View
              style={{
                opacity: tick,
                transform: [{ scale: tick.interpolate({ inputRange: [0, 1], outputRange: [TICK_FROM, 1] }) }],
              }}>
              <Svg width={18} height={18} viewBox="0 0 18 18">
                <Path
                  d="M13.9365 5.26536C13.8946 5.16421 13.8331 5.07231 13.7556 4.99493C13.6782 4.91746 13.5863 4.856 13.4852 4.81406C13.384 4.77213 13.2756 4.75055 13.1661 4.75055C13.0566 4.75055 12.9482 4.77213 12.847 4.81406C12.7459 4.856 12.654 4.91746 12.5766 4.99493L7.33342 10.2391L5.42322 8.32789C5.26687 8.17154 5.05482 8.0837 4.8337 8.0837C4.61259 8.0837 4.40054 8.17154 4.24419 8.32789C4.08784 8.48424 4 8.69629 4 8.91741C4 9.13852 4.08784 9.35057 4.24419 9.50692L6.74391 12.0066C6.82129 12.0841 6.91319 12.1456 7.01434 12.1875C7.1155 12.2294 7.22392 12.251 7.33342 12.251C7.44292 12.251 7.55135 12.2294 7.65251 12.1875C7.75366 12.1456 7.84556 12.0841 7.92294 12.0066L13.7556 6.17396C13.8331 6.09658 13.8946 6.00468 13.9365 5.90353C13.9784 5.80237 14 5.69395 14 5.58445C14 5.47494 13.9784 5.36652 13.9365 5.26536Z"
                  fill={color.controlSelectedIcon}
                />
              </Svg>
            </Animated.View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  label: {
    flex: 1,
  },
  hit: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: color.controlDefaultBorder,
    overflow: 'hidden',
  },
  boxChecked: {
    borderWidth: 0,
    backgroundColor: color.controlSelectedBg,
  },
});
