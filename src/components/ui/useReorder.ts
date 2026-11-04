import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard } from 'react-native';

import { haptics } from '@/data/haptics';

type Drag = { id: string; from: number; to: number };

/**
 * Glisser-déposer par la poignée, pour une liste de lignes de hauteurs variables : la ligne suit le doigt, les
 * autres s'écartent d'une ligne. `gap` est l'écart entre deux lignes, `fallback` la hauteur d'une ligne pas encore
 * mesurée.
 */
export function useReorder(ids: string[], onMove: (id: string, to: number) => void, gap: number, fallback: number) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  // Hauteur de chaque ligne : un texte long en fait plusieurs, le pas du déplacement suit.
  const heights = useRef(new Map<string, number>()).current;
  const pitchOf = (index: number) => (heights.get(ids[index]) ?? fallback) + gap;

  const start = (id: string, from: number) => {
    Keyboard.dismiss();
    dragY.setValue(0);
    haptics.lift();
    setDrag({ id, from, to: from });
  };
  const moveTo = (dy: number) => {
    dragY.setValue(dy);
    setDrag((d) => {
      if (!d) return d;
      // La ligne prend la place d'une voisine dès qu'elle en a franchi la moitié.
      let to = d.from;
      let passed = 0;
      while (dy > 0 && to + 1 < ids.length && dy > passed + pitchOf(to + 1) / 2) passed += pitchOf(++to);
      while (dy < 0 && to > 0 && -dy > passed + pitchOf(to - 1) / 2) passed += pitchOf(--to);
      return to === d.to ? d : { ...d, to };
    });
  };
  // Un petit cran à chaque emplacement franchi.
  const lastSlot = useRef<number | null>(null);
  useEffect(() => {
    const slot = drag?.to ?? null;
    if (slot !== null && lastSlot.current !== null && slot !== lastSlot.current) haptics.selection();
    lastSlot.current = slot;
  }, [drag?.to]);
  const end = () => {
    if (drag && drag.to !== drag.from) onMove(drag.id, drag.to);
    dragY.setValue(0);
    setDrag(null);
  };

  /** Décalage d'une ligne : la position sous le doigt pour celle qu'on déplace, ± une ligne pour les autres. */
  const offsetOf = (id: string, index: number): Animated.Value | number => {
    if (!drag) return 0;
    if (drag.id === id) return dragY;
    const pitch = pitchOf(drag.from);
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -pitch;
    if (drag.from > drag.to && index >= drag.to && index < drag.from) return pitch;
    return 0;
  };

  return {
    dragging: drag?.id ?? null,
    offsetOf,
    start,
    move: moveTo,
    end,
    setHeight: (id: string, height: number) => heights.set(id, height),
  };
}

/** Déplace l'élément `id` à l'index `to`. */
export function moveItem<T extends { id: string }>(list: T[], id: string, to: number) {
  const item = list.find((i) => i.id === id);
  if (!item) return list;
  const rest = list.filter((i) => i.id !== id);
  return [...rest.slice(0, to), item, ...rest.slice(to)];
}
