import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { AppText, Tappable } from '@/components/ui';
import { color, space, text } from '@/theme/tokens';

/** Hauteur d'une ligne de texte, celle de la poignée et de la croix. */
export const EDIT_LINE = 24;

type EditRowProps = {
  value: string;
  placeholder: string;
  focused: boolean;
  /** Différent de 0 quand la ligne doit passer en saisie ; une nouvelle valeur la refocalise. */
  focusRequest: number;
  offset: Animated.Value | number;
  dragging: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  /** Entrée : ligne suivante pour un ingrédient, fin de saisie pour une étape. */
  onSubmit: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragMove: (dy: number) => void;
  onDragEnd: () => void;
  onHeight: (height: number) => void;
  /** Sous le texte : le minuteur d'une étape. */
  children?: ReactNode;
};

/**
 * Figma « Modifier la recette » : poignée, texte modifiable sur place, croix quand la ligne est en saisie, filet
 * entre deux lignes. Comme sur la liste de courses, le texte passe à la ligne tout seul et Entrée ne fait jamais de
 * saut de ligne.
 */
export function EditRow(props: EditRowProps) {
  const { value, focused, focusRequest, offset, dragging } = props;
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
    <Animated.View
      onLayout={(e) => props.onHeight(e.nativeEvent.layout.height)}
      style={[styles.row, dragging && styles.dragging, { transform: [{ translateY: offset }] }]}>
      <View {...pan.panHandlers} style={styles.handle} accessibilityLabel={`Déplacer ${value || 'la ligne'}`}>
        <Icon name="grip" color={color.textPrimary} />
      </View>
      <View style={styles.body}>
        <TextInput
          ref={input}
          value={value}
          multiline
          scrollEnabled={false}
          onChangeText={(next) => props.onChange(next.replace(/\n/g, ' '))}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          onSubmitEditing={props.onSubmit}
          submitBehavior="submit"
          // Le web ne connaît pas submitBehavior, ni la hauteur du texte (voir ShoppingRow).
          {...(Platform.OS === 'web' && { blurOnSubmit: true, numberOfLines: 1 })}
          returnKeyType="next"
          placeholder={props.placeholder}
          placeholderTextColor={color.textSecondary}
          cursorColor={color.textPrimary}
          selectionColor={color.textPrimary}
          style={styles.input}
        />
        {props.children}
      </View>
      {focused && (
        <Tappable
          accessibilityRole="button"
          accessibilityLabel={`Supprimer ${value || 'la ligne'}`}
          onPress={props.onRemove}
          // Sur le web, l'appui ferait perdre le focus au champ, et la croix disparaîtrait avant le clic.
          {...(Platform.OS === 'web' && { onMouseDown: (e: { preventDefault: () => void }) => e.preventDefault() })}
          hitSlop={space[8]}>
          <Icon name="close" color={color.textPrimary} />
        </Tappable>
      )}
    </Animated.View>
  );
}

/** Figma : « Ajouter un ingrédient » / « Ajouter une étape », sous la dernière ligne. */
export function AddRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tappable accessibilityRole="button" onPress={onPress} style={styles.add}>
      <Icon name="plus" color={color.textPrimary} />
      <AppText style={styles.addText}>{label}</AppText>
    </Tappable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    // Figma : filet à 16 px sous la ligne, la suivante (ou « Ajouter ») 16 px plus bas.
    paddingBottom: space[16],
    marginBottom: space[16],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.borderDefault,
    backgroundColor: color.bgSurface,
  },
  dragging: {
    zIndex: 1,
    opacity: 0.9,
  },
  handle: {
    width: EDIT_LINE,
    height: EDIT_LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: space[8],
  },
  input: {
    ...text.body,
    lineHeight: EDIT_LINE,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'top',
    color: color.textPrimary,
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none', fieldSizing: 'content', resize: 'none' } as object)),
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  addText: {
    lineHeight: EDIT_LINE,
  },
});
