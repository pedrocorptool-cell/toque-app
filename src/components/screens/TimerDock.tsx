import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { TimerChip } from '@/components/ui';
import { useTimers } from '@/data/TimersContext';
import { space } from '@/theme/tokens';

/**
 * Pastille compacte des minuteurs dans les onglets (celle du pas à pas) : les minuteurs continuent quand on quitte la fiche, la pastille
 * les rappelle au-dessus de la barre d'onglets et ouvre la sheet « Minuteur », d'où l'on revient à la recette.
 */
export function TimerDock({ inline, style }: { inline?: boolean; style?: StyleProp<ViewStyle> }) {
  const { timers, setSheetOpen } = useTimers();
  if (!timers.length) return null;
  const next = Math.min(...timers.map((t) => t.remaining));
  return (
    <View style={[inline ? styles.inline : styles.dock, style]}>
      <TimerChip count={timers.length} remaining={next} onPress={() => setSheetOpen(true)} />
    </View>
  );
}

/** Hauteur de la pastille et son écart, pour remonter ce qui s'affiche au-dessus (toasts). */
export const TIMER_DOCK_SPACE = 48 + space[16];

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: space[16],
    bottom: space[16],
  },
  /** Sous un écran plutôt que par-dessus : rien n'est masqué en bas de page. */
  inline: {
    alignSelf: 'flex-start',
    marginHorizontal: space[16],
    marginTop: space[8],
    marginBottom: space[16],
  },
});
