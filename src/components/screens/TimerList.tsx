import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, Blink, formatDuration } from '@/components/ui';
import { isDone, useTimers, type Timer } from '@/data/TimersContext';
import { color, radius, space } from '@/theme/tokens';

type TimerListProps = {
  timers: Timer[];
  /** Après « Arrêter » sur un minuteur terminé. */
  onStop?: () => void;
};

/** Figma : cartes « Etape n » de « Bottom Sheet/ Minuteur » et « Dialogue/ Minuteur ». */
export function TimerList({ timers, onStop }: TimerListProps) {
  return (
    <View style={styles.list}>
      {timers.map((t) => (
        <TimerRow key={t.id} timer={t} onStop={onStop} />
      ))}
    </View>
  );
}

function TimerRow({ timer, onStop }: { timer: Timer; onStop?: () => void }) {
  const { toggle, reset, remove } = useTimers();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="label" color={color.textSecondary} style={styles.step}>
          {`Étape ${timer.step + 1}`}
        </AppText>
        <Blink active={isDone(timer)}>
          <AppText variant="timer" style={styles.time}>
            {formatDuration(timer.remaining)}
          </AppText>
        </Blink>
      </View>
      {isDone(timer) ? (
        <View style={styles.controls}>
          <Control
            label="Arrêter"
            onPress={() => {
              remove(timer.id);
              onStop?.();
            }}
          />
        </View>
      ) : (
        <View style={styles.controls}>
          <Control
            icon={timer.running ? 'pause' : 'play'}
            label={timer.running ? 'Mettre en pause' : 'Reprendre'}
            onPress={() => toggle(timer.recipeId, timer.step, timer.duration)}
          />
          <Control icon="retry" label="Recommencer" onPress={() => reset(timer.id)} />
          <Control icon="close" label="Supprimer le minuteur" onPress={() => remove(timer.id)} />
        </View>
      )}
    </View>
  );
}

/** Une case de la barre de contrôle ; sans icône, le libellé est affiché. */
function Control({ icon, label, onPress }: { icon?: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
      {icon ? <Icon name={icon} /> : <AppText>{label}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space[16],
  },
  card: {
    gap: space[12],
    padding: space[16],
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: {
    lineHeight: 24,
    textTransform: 'uppercase',
  },
  time: {
    lineHeight: 36,
  },
  controls: {
    height: 56,
    flexDirection: 'row',
    gap: 1,
    overflow: 'hidden',
    borderRadius: radius.md,
  },
  control: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.aiBg,
  },
  pressed: {
    backgroundColor: color.aiSubtle,
  },
});
