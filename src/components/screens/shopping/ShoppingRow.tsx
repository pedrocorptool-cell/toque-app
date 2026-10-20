import { useEffect, useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText, Checkbox } from '@/components/ui';
import type { ShoppingItem } from '@/data/ShoppingContext';
import { color, space, text } from '@/theme/tokens';

/** Hauteur d'une ligne (24 px) plus l'écart entre deux lignes (16 px) : le pas du glisser-déposer. */
export const ROW_PITCH = 24 + space[16];

type ToBuyRowProps = {
  item: ShoppingItem;
  focused: boolean;
  autoFocus: boolean;
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
  const { item, focused, autoFocus, offset, dragging } = props;
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
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

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
      {focused && (
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
export function CheckedRow({ item, onToggle }: { item: ShoppingItem; onToggle: () => void }) {
  return (
    <View style={[styles.row, styles.checkedRow]}>
      <Checkbox checked onChange={onToggle} />
      <AppText color={color.textSecondary} style={styles.checkedText}>
        {item.label}
      </AppText>
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
  checkedText: {
    flex: 1,
    textDecorationLine: 'line-through',
  },
});
