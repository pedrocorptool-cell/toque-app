import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { AppText, Blink, formatDuration } from '@/components/ui';
import { useRecipes } from '@/data/RecipesContext';
import { isDone, useTimers, type Timer } from '@/data/TimersContext';
import { color, font, radius, space } from '@/theme/tokens';

type TimerListProps = {
  timers: Timer[];
  /** Après « Arrêter » sur un minuteur terminé (déjà retiré de la liste). */
  onStop?: (timer: Timer) => void;
  /** Carte et chevron : ouvrent la fiche de la recette à l'étape du minuteur (sauf pour la recette à l'écran). */
  onOpenRecipe?: (timer: Timer) => void;
};

/** Figma (639:17832) : cartes de « Bottom Sheet/ Minuteur », nom de la recette au-dessus de l'étape quand
 * plusieurs recettes ont des minuteurs. */
export function TimerList({ timers, onStop, onOpenRecipe }: TimerListProps) {
  // Le nom de la recette s'affiche dès qu'on n'est pas sur la fiche de l'unique recette en cours.
  const { focusedRecipeId } = useTimers();
  const recipeIds = new Set(timers.map((t) => t.recipeId));
  const showTitle = recipeIds.size > 1 || !recipeIds.has(focusedRecipeId ?? '');
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
  const open = canOpen ? () => onOpenRecipe(timer) : undefined;
  return (
    // Toute la carte ouvre la recette (hors de sa fiche) ; les boutons du bas gardent leur action. Pour les
    // lecteurs d'écran, c'est le chevron qui porte ce bouton.
    <Pressable
      accessible={false}
      disabled={!canOpen}
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}>
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
                onPress={open}
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
              onStop?.(timer);
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
    </Pressable>
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
  pressedCard: {
    opacity: 0.8,
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
