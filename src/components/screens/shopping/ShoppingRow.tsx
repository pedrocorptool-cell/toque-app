import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText, Checkbox } from '@/components/ui';
import type { ShoppingItem } from '@/data/ShoppingContext';
import { motion } from '@/theme/motion';
import { color, space, text } from '@/theme/tokens';

/** Hauteur d'une ligne (24 px) plus l'écart entre deux lignes (16 px) : le pas du glisser-déposer. */
export const ROW_PITCH = 24 + space[16];

type ToBuyRowProps = {
  item: ShoppingItem;
  focused: boolean;
  /** Faux pour la ligne vierge d'une liste vide : pas de croix. */
  removable: boolean;
  /** Différent de 0 quand la ligne doit passer en saisie ; une nouvelle valeur la refocalise. */
  focusRequest: number;
  /** Décalage de la ligne pendant qu'une autre est déplacée (± une ligne), ou position de celle qu'on déplace. */
  offset: Animated.Value | number;
  dragging: boolean;
  onToggle: () => void;
  onRename: (label: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
};

/** Figma « Liste » : poignée, case à cocher, texte modifiable sur place, croix quand la ligne est en saisie. */
export function ToBuyRow(props: ToBuyRowProps) {
  const { item, focused, focusRequest, offset, dragging } = props;
  // Les rappels changent à chaque rendu ; le PanResponder, créé une fois, passe par cette référence.
  const latest = useRef(props);
  latest.current = props;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.onDragStart(),
      onPanResponderMove: (_, g) => latest.current.onDragMove(g.dy),
      onPanResponderRelease: () => latest.current.onDragEnd(),
      onPanResponderTerminate: () => latest.current.onDragEnd(),
    }),
  ).current;

  const input = useRef<TextInput>(null);
  useEffect(() => {
    if (focusRequest) input.current?.focus();
  }, [focusRequest]);

  return (
    <Animated.View style={[styles.row, dragging && styles.dragging, { transform: [{ translateY: offset }] }]}>
      <View {...pan.panHandlers} style={styles.handle} accessibilityLabel={`Déplacer ${item.label}`}>
        <Icon name="grip" color={color.textPrimary} />
      </View>
      <Checkbox checked={false} onChange={props.onToggle} />
      <TextInput
        ref={input}
        value={item.label}
        onChangeText={props.onRename}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onSubmitEditing={props.onSubmit}
        submitBehavior="submit"
        returnKeyType="next"
        placeholder="Nouvel article"
        placeholderTextColor={color.textSecondary}
        cursorColor={color.textPrimary}
        selectionColor={color.textPrimary}
        style={styles.input}
      />
      {focused && props.removable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Supprimer ${item.label || 'l’article'}`}
          onPress={props.onRemove}
          // Sur le web, l'appui ferait perdre le focus au champ, et la croix disparaîtrait avant le clic.
          {...(Platform.OS === 'web' && { onMouseDown: (e: { preventDefault: () => void }) => e.preventDefault() })}
          hitSlop={space[8]}>
          <Icon name="close" color={color.textPrimary} />
        </Pressable>
      )}
    </Animated.View>
  );
}

/** Figma « Liste » : article coché, barré et grisé, aligné sous les cases des articles à acheter. */
/** Le trait qui barre l'article qu'on vient de cocher se trace de gauche à droite. */
const STRIKE_DELAY = 120;
const STRIKE_DURATION = 280;

type CheckedRowProps = {
  item: ShoppingItem;
  onToggle: () => void;
  /** Article qu'on vient de cocher : le trait se trace au lieu d'être déjà là. */
  animateStrike?: boolean;
};

export function CheckedRow({ item, onToggle, animateStrike = false }: CheckedRowProps) {
  // Trait dessiné par-dessus le texte pendant l'animation, puis barré du texte comme les autres lignes.
  const [drawing, setDrawing] = useState(animateStrike);
  const strike = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!drawing) return;
    const draw = Animated.sequence([
      Animated.delay(STRIKE_DELAY),
      Animated.timing(strike, { toValue: 1, duration: STRIKE_DURATION, easing: motion.easeOut, useNativeDriver: true }),
    ]);
    draw.start(({ finished }) => finished && setDrawing(false));
    return () => draw.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.row, styles.checkedRow]}>
      <Checkbox checked onChange={onToggle} />
      <View style={styles.checkedLabel}>
        <AppText
          color={color.textSecondary}
          style={!drawing && styles.struck}
          // Sur plusieurs lignes, un seul trait ne suffit pas : barré direct.
          onTextLayout={(e) => e.nativeEvent.lines.length > 1 && setDrawing(false)}>
          {item.label}
        </AppText>
        {drawing && <Animated.View pointerEvents="none" style={[styles.strike, { transform: [{ scaleX: strike }] }]} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: color.bgPage,
  },
  dragging: {
    zIndex: 1,
    opacity: 0.9,
  },
  handle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    ...text.body,
    flex: 1,
    padding: 0,
    color: color.textPrimary,
    // Sur le web, le navigateur entoure le champ actif ; la croix suffit à montrer la saisie.
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  checkedRow: {
    paddingLeft: 24 + space[8],
  },
  checkedLabel: {
    flexShrink: 1,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  // Même place et même épaisseur que le barré du texte.
  strike: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '55%',
    height: 1,
    backgroundColor: color.textSecondary,
    transformOrigin: 'left',
  },
});
