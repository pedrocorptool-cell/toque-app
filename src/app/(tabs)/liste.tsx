import { useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { CheckedRow, ROW_PITCH, ToBuyRow } from '@/components/screens/shopping/ShoppingRow';
import { AppText, ChefButton, Dialog, Logo, Toast } from '@/components/ui';
import { useShopping } from '@/data/ShoppingContext';
import { color, radius, space } from '@/theme/tokens';

type Drag = { id: string; from: number; to: number };

/** Figma : « Liste » (244:3444) — liste de courses, articles à acheter puis articles cochés. */
export default function ListeScreen() {
  const insets = useSafeAreaInsets();
  const { items, addItem, rename, toggle, remove, clear, move } = useShopping();
  const toBuy = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Glisser-déposer par la poignée : la ligne suit le doigt, les autres s'écartent d'une ligne.
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  const startDrag = (id: string, from: number) => {
    Keyboard.dismiss();
    dragY.setValue(0);
    setDrag({ id, from, to: from });
  };
  const moveDrag = (dy: number) => {
    dragY.setValue(dy);
    setDrag((d) => {
      if (!d) return d;
      const to = Math.max(0, Math.min(toBuy.length - 1, d.from + Math.round(dy / ROW_PITCH)));
      return to === d.to ? d : { ...d, to };
    });
  };
  const endDrag = () => {
    if (drag && drag.to !== drag.from) move(drag.id, drag.to);
    dragY.setValue(0);
    setDrag(null);
  };

  /** Décalage des autres lignes pendant un déplacement. */
  const shiftOf = (index: number) => {
    if (!drag) return 0;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -ROW_PITCH;
    if (drag.from > drag.to && index >= drag.to && index < drag.from) return ROW_PITCH;
    return 0;
  };

  const startNewItem = () => setNewId(addItem());

  const count = toBuy.length;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space[24] }]}>
        <View style={styles.topRow}>
          <Logo />
          <ChefButton onPress={() => setToast('L’offre Toqué Chef arrive bientôt')} />
        </View>
        <AppText variant="title" color={color.textOnBrandPrimary}>
          Liste de courses
        </AppText>
      </View>

      <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!drag}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="overline" color={color.textSecondary}>
                {`${count} article${count > 1 ? 's' : ''}`}
              </AppText>
              {items.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setClearOpen(true)}
                  hitSlop={space[8]}
                  style={({ pressed }) => [styles.clear, pressed && styles.pressed]}>
                  <Icon name="trash" color={color.actionSecondaryIcon} />
                  <AppText>Tout supprimer</AppText>
                </Pressable>
              )}
            </View>

            {items.length === 0 && (
              <AppText color={color.textSecondary}>
                Ta liste est vide. Ajoute un article ici, ou depuis les ingrédients d’une recette.
              </AppText>
            )}

            {toBuy.map((item, index) => (
              <ToBuyRow
                key={item.id}
                item={item}
                focused={focusedId === item.id}
                autoFocus={newId === item.id}
                dragging={drag?.id === item.id}
                offset={drag?.id === item.id ? dragY : shiftOf(index)}
                onToggle={() => toggle(item.id)}
                onRename={(label) => rename(item.id, label)}
                onFocus={() => setFocusedId(item.id)}
                onBlur={() => {
                  setFocusedId((id) => (id === item.id ? null : id));
                  // Un article laissé vide disparaît.
                  if (!item.label.trim()) remove(item.id);
                }}
                onSubmit={() => (item.label.trim() ? startNewItem() : Keyboard.dismiss())}
                onRemove={() => remove(item.id)}
                onDragStart={() => startDrag(item.id, index)}
                onDragMove={moveDrag}
                onDragEnd={endDrag}
              />
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={startNewItem}
              style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
              <Icon name="plus" color={color.textPrimary} />
              <AppText>Ajouter</AppText>
            </Pressable>
          </View>

          {checked.length > 0 && (
            <View style={styles.section}>
              <AppText variant="overline" color={color.textSecondary} style={styles.sectionTitle}>
                {`Articles cochés (${checked.length})`}
              </AppText>
              {checked.map((item) => (
                <CheckedRow key={item.id} item={item} onToggle={() => toggle(item.id)} />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {toast && (
        <View style={styles.toast}>
          <Toast message={toast} onClose={() => setToast(null)} />
        </View>
      )}

      <Dialog
        visible={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Vider la liste"
        message="Tous les articles de ta liste de courses seront supprimés, cochés ou non."
        confirmLabel="Oui, tout supprimer"
        onConfirm={() => {
          setClearOpen(false);
          clear();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bgBrandPage,
  },
  header: {
    gap: space[24],
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheet: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
  },
  content: {
    gap: space[24],
    padding: space[16],
  },
  section: {
    gap: space[16],
  },
  sectionHeader: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    lineHeight: 24,
  },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  add: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingLeft: 24 + space[8],
  },
  pressed: {
    opacity: 0.6,
  },
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    bottom: space[16],
  },
});
