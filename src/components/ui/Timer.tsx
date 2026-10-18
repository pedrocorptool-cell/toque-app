import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { color, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

type TimerCardProps = {
  remaining: number;
  running: boolean;
  onToggle?: () => void;
  onCancel?: () => void;
};

/** Figma : « Minuteur » types Carte arrêtée / Carte en cours (pas à pas). */
export function TimerCard({ remaining, running, onToggle, onCancel }: TimerCardProps) {
  return (
    <View style={[styles.surface, styles.card]}>
      <View style={styles.cardText}>
        <AppText variant="label" color={color.textOnBrandSecondary} style={styles.cardLabel}>
          Minuteur
        </AppText>
        <AppText variant="timer" color={color.textOnBrandPrimary}>
          {formatDuration(remaining)}
        </AppText>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={running ? 'Mettre en pause' : 'Démarrer'}
          onPress={onToggle}
          style={[styles.square, styles.squarePrimary]}>
          <Icon name={running ? 'pause' : 'play'} />
        </Pressable>
        {running && (
          <Pressable accessibilityRole="button" accessibilityLabel="Annuler le minuteur" onPress={onCancel} style={styles.square}>
            <Icon name="close" color={color.textOnBrandPrimary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/** Figma : « Minuteur » type Widget — rappel des minuteurs actifs. */
export function TimerWidget({ count, remaining, onPress }: { count: number; remaining: number; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.surface, styles.widget]}>
      <AppText variant="caption" color={color.textOnBrandSecondary} style={styles.widgetLabel}>
        {`Minuteurs (${count})`}
      </AppText>
      <View style={styles.widgetRight}>
        <AppText variant="timerSmall" color={color.textOnBrandPrimary}>
          {formatDuration(remaining)}
        </AppText>
        <Icon name="chevronDown" size={16} color={color.textOnBrandPrimary} />
      </View>
    </Pressable>
  );
}

type TimerPillProps = {
  remaining: number;
  onPress?: () => void;
  /** Dans une étape : lecture / pause. Sans valeur : chevron (rappel déroulant). */
  running?: boolean;
};

/** Figma : « Minuteur » type Pastille — dans une étape de recette. */
export function TimerPill({ remaining, onPress, running }: TimerPillProps) {
  const icon = running === undefined ? 'chevronDown' : running ? 'pause' : 'play';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={running === undefined ? undefined : running ? 'Mettre en pause le minuteur' : 'Lancer le minuteur'}
      onPress={onPress}
      style={({ pressed }) => [styles.surface, styles.pill, pressed && styles.pressed]}>
      <AppText variant="label" color={color.textOnBrandPrimary}>
        {formatDuration(remaining)}
      </AppText>
      <Icon name={icon} size={16} color={color.textOnBrandPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.controlSelectedBg,
  },
  card: {
    height: 88,
    justifyContent: 'space-between',
    padding: space[16],
    borderRadius: radius.lg,
  },
  cardText: {
    gap: space[8],
  },
  cardLabel: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: space[8],
  },
  square: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  squarePrimary: {
    backgroundColor: color.aiBg,
  },
  widget: {
    height: 48,
    justifyContent: 'space-between',
    padding: space[8],
    borderRadius: radius.lg,
  },
  widgetLabel: {
    lineHeight: 20,
  },
  widgetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  pressed: {
    opacity: 0.8,
  },
  pill: {
    alignSelf: 'flex-start',
    height: 40,
    gap: space[4],
    paddingHorizontal: space[12],
    borderRadius: radius.pill,
  },
});
