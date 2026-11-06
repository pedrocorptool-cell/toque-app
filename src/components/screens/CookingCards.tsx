import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText, Dialog, Tappable, formatDuration } from '@/components/ui';
import { useCooking, type Cooking } from '@/data/CookingContext';
import type { Recipe } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { useTimers, type Timer } from '@/data/TimersContext';
import { color, font, radius, space } from '@/theme/tokens';

/** Figma « Home » (Tests Recette en cours) : avec plusieurs recettes, la suivante dépasse à droite. */
const PEEK_WIDTH = 307;
const GAP = space[16];

type Entry = { cooking: Cooking; recipe: Recipe; timer?: Timer };

/**
 * Recettes en cours en haut de la home : d'abord celle dont le minuteur sonne le plus tôt, puis la plus récente.
 * Toucher une card reprend le mode étape par étape à l'étape en cours ; la croix arrête la recette.
 */
export function CookingCards() {
  const { cooking, end } = useCooking();
  const { recipes } = useRecipes();
  const { timers } = useTimers();
  const { width } = useWindowDimensions();
  const [stopping, setStopping] = useState<Recipe | null>(null);

  // Une recette supprimée n'a plus de card.
  const entries = cooking
    .flatMap((c): Entry[] => {
      const recipe = recipes.find((r) => r.id === c.recipeId);
      const next = timers.filter((t) => t.recipeId === c.recipeId).sort((x, y) => x.remaining - y.remaining)[0];
      return recipe ? [{ cooking: c, recipe, timer: next }] : [];
    })
    .sort(
      (a, b) =>
        (a.timer?.remaining ?? Infinity) - (b.timer?.remaining ?? Infinity) ||
        b.cooking.updatedAt - a.cooking.updatedAt,
    );

  if (!entries.length) return null;
  const single = entries.length === 1;
  const cardWidth = single ? width - space[16] * 2 : PEEK_WIDTH;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!single}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        style={styles.scroller}
        contentContainerStyle={styles.row}>
        {entries.map((entry) => (
          <CookingCard key={entry.recipe.id} entry={entry} width={cardWidth} onStop={() => setStopping(entry.recipe)} />
        ))}
      </ScrollView>

      {/* Modale provisoire, en attendant la maquette de Pierre. */}
      <Dialog
        visible={stopping !== null}
        onClose={() => setStopping(null)}
        title="Arrêter la recette ?"
        message="Ton avancement et les minuteurs de cette recette seront perdus."
        confirmLabel="Arrêter la recette"
        onConfirm={() => {
          if (stopping) end(stopping.id);
          setStopping(null);
        }}
      />
    </>
  );
}

function CookingCard({ entry, width, onStop }: { entry: Entry; width: number; onStop: () => void }) {
  const { cooking, recipe, timer } = entry;
  const total = recipe.steps.length;
  const status = timer
    ? timer.remaining === 0
      ? 'Terminé !'
      : formatDuration(timer.remaining)
    : cooking.step >= total
      ? 'Photo du plat'
      : `Étape ${cooking.step + 1}/${total}`;

  // La croix est posée sur la card, pas dedans : un bouton ne peut pas en contenir un autre.
  return (
    <View style={{ width }}>
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={`Reprendre ${recipe.title}, ${status}`}
        onPress={() => router.push({ pathname: '/pas-a-pas/[id]', params: { id: recipe.id } })}
        style={styles.card}>
        <View style={styles.top}>
          <View style={styles.badge}>
            <AppText variant="label" color={color.premiumText}>
              En cours
            </AppText>
          </View>
        </View>
        <View style={styles.body}>
          <Image source={recipe.image} style={styles.image} />
          <View style={styles.texts}>
            <AppText variant="cardTitle" color={color.textOnBrandPrimary} numberOfLines={1}>
              {recipe.title}
            </AppText>
            <AppText style={styles.status} color={color.textOnBrandSecondary}>
              {status}
            </AppText>
          </View>
        </View>
      </Tappable>
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={`Arrêter ${recipe.title}`}
        onPress={onStop}
        hitSlop={space[12]}
        style={styles.close}>
        <Icon name="close" color={color.textOnBrandPrimary} />
      </Tappable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Le carrousel va jusqu'aux bords de l'écran ; les cards restent alignées sur les recettes du dessous.
  scroller: {
    marginHorizontal: -space[16],
    flexGrow: 0,
  },
  row: {
    gap: GAP,
    paddingHorizontal: space[16],
  },
  card: {
    gap: space[24],
    padding: space[16],
    borderRadius: radius.xl,
    backgroundColor: color.premiumText,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: {
    position: 'absolute',
    top: space[16],
    right: space[16],
  },
  badge: {
    padding: space[4],
    borderRadius: radius.sm,
    backgroundColor: color.premiumBg,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },
  texts: {
    flex: 1,
    gap: space[4],
  },
  status: {
    fontFamily: font.light,
    fontSize: 20,
    lineHeight: 30,
  },
});
