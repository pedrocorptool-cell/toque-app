import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, IconButton, TimerCard, Toast } from '@/components/ui';
import { useRecipes } from '@/data/RecipesContext';
import { useTimers } from '@/data/TimersContext';
import { color, radius, space, text } from '@/theme/tokens';

const BLUR_HEIGHT = 160;

/** Figma : « Recette/ Stepp/ Minuteur off » (191:4929) et « Minuteur on » (352:12715). */
export default function StepByStepScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes } = useRecipes();
  const { timerFor, toggle, remove } = useTimers();
  const insets = useSafeAreaInsets();
  const recipe = recipes.find((r) => r.id === id);

  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Changement d'étape : le texte glisse depuis le côté de la flèche touchée.
  const enter = useRef(new Animated.Value(1)).current;
  const direction = useRef(1);

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, enter]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!recipe) return null;

  const step = recipe.steps[index];
  const last = recipe.steps.length - 1;
  const timer = timerFor(recipe.id, index);

  const goTo = (next: number) => {
    direction.current = next > index ? 1 : -1;
    setIndex(next);
  };

  const translateX = enter.interpolate({ inputRange: [0, 1], outputRange: [direction.current * 32, 0] });

  return (
    <View style={styles.screen}>
      <Image source={recipe.image} blurRadius={25} style={[styles.blur, { height: BLUR_HEIGHT + insets.top }]} />
      <LinearGradient
        colors={['transparent', color.bgBrandPage]}
        style={[styles.blurFade, { top: (BLUR_HEIGHT + insets.top) / 2, height: (BLUR_HEIGHT + insets.top) / 2 }]}
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space[16] }]}>
        <View style={styles.topRow}>
          <Image source={recipe.image} style={styles.thumb} />
          <IconButton icon="close" accessibilityLabel="Quitter le mode étape par étape" onPress={() => router.back()} />
        </View>

        <Animated.View style={[styles.step, { opacity: enter, transform: [{ translateX }] }]}>
          <View style={styles.number}>
            <AppText style={styles.numberText} color={color.textOnBrandPrimary}>
              {index + 1}
            </AppText>
          </View>
          <AppText style={styles.instruction} color={color.textOnBrandPrimary}>
            {step.text}
          </AppText>
          {step.timer !== undefined && (
            <TimerCard
              remaining={timer?.remaining ?? step.timer}
              running={timer?.running ?? false}
              onToggle={() => toggle(recipe.id, index, step.timer!)}
              onCancel={() => timer && remove(timer.id)}
            />
          )}
        </Animated.View>
      </ScrollView>

      {toast && (
        <View style={[styles.toast, { bottom: insets.bottom + space[24] + 48 + space[16] }]}>
          <Toast message={toast} onClose={() => setToast(null)} />
        </View>
      )}

      <View style={[styles.bottomRow, { paddingBottom: insets.bottom + space[24] }]}>
        <RoundButton
          icon="magic"
          label="Modifier avec l’IA"
          onPress={() => setToast('La modification avec l’IA arrivera dans une prochaine version')}
        />
        <View style={styles.nav}>
          <RoundButton icon="caretLeft" label="Étape précédente" disabled={index === 0} onPress={() => goTo(index - 1)} />
          <RoundButton icon="caretRight" label="Étape suivante" disabled={index === last} onPress={() => goTo(index + 1)} />
        </View>
      </View>
    </View>
  );
}

/** Figma : boutons ronds blancs 48 px, icône orange (« CTA/ Round/ Light »). */
function RoundButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && styles.roundPressed, disabled && styles.disabled]}>
      <Icon name={icon} color={color.actionSecondaryIcon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    opacity: 0.6,
  },
  blurFade: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  content: {
    gap: space[32],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: color.borderPhoto,
  },
  step: {
    gap: space[32],
  },
  number: {
    width: 64,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.textOnBrandPrimary,
    borderRadius: 40,
  },
  numberText: {
    ...text.stat,
    lineHeight: 28,
  },
  instruction: {
    fontSize: 24,
    lineHeight: 32,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
  },
  nav: {
    flexDirection: 'row',
    gap: space[8],
  },
  round: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: color.bgSurface,
  },
  roundPressed: {
    backgroundColor: color.bgPage,
  },
  disabled: {
    opacity: 0.4,
  },
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
  },
});
