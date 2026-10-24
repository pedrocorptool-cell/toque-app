import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, Blink, formatDuration } from '@/components/ui';
import { useRecipes } from '@/data/RecipesContext';
import { isDone, useTimers, type Timer } from '@/data/TimersContext';
import { color, font, radius, space } from '@/theme/tokens';

type TimerListProps = {
  timers: Timer[];
  /** Après « Arrêter » sur un minuteur terminé. */
  onStop?: () => void;
  /** Chevron de la carte : ouvre la fiche de la recette (absent pour la recette déjà à l'écran). */
  onOpenRecipe?: (recipeId: string) => void;
};

/** Figma (639:17832) : cartes de « Bottom Sheet/ Minuteur », nom de la recette au-dessus de l'étape quand
 * plusieurs recettes ont des minuteurs. */
export function TimerList({ timers, onStop, onOpenRecipe }: TimerListProps) {
  // Le nom de la recette ne sert qu'à distinguer plusieurs recettes en cours.
  const showTitle = new Set(timers.map((t) => t.recipeId)).size > 1;
  return (
    <View style={styles.list}>
      {timers.map((t) => (
        <TimerRow key={t.id} timer={t} showTitle={showTitle} onStop={onStop} onOpenRecipe={onOpenRecipe} />
      ))}
    </View>
  );
}

function TimerRow({
  timer,
  showTitle,
  onStop,
  onOpenRecipe,
}: { timer: Timer; showTitle: boolean } & Omit<TimerListProps, 'timers'>) {
  const { toggle, reset, remove, focusedRecipeId } = useTimers();
  const { recipes } = useRecipes();
  const title = recipes.find((r) => r.id === timer.recipeId)?.title;
  const canOpen = onOpenRecipe && timer.recipeId !== focusedRecipeId;
  return (
    <View style={styles.card}>
      <View>
        {showTitle && title && <AppText style={styles.recipe}>{title}</AppText>}
        <View style={styles.header}>
          <AppText variant="label" color={color.textSecondary} style={styles.step}>
            {`Étape ${timer.step + 1}`}
          </AppText>
          <View style={styles.headerRight}>
            <Blink active={isDone(timer)}>
              <AppText variant="timer" style={styles.time}>
                {formatDuration(timer.remaining)}
              </AppText>
            </Blink>
            {canOpen && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Voir la recette ${title ?? ''}`.trim()}
                hitSlop={space[12]}
                onPress={() => onOpenRecipe(timer.recipeId)}
                style={({ pressed }) => pressed && styles.pressedIcon}>
                <Icon name="caretRight" />
              </Pressable>
            )}
          </View>
        </View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  recipe: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 24,
  },
  pressedIcon: {
    opacity: 0.6,
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
