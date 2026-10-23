import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { CheckedRow, ROW_PITCH, ToBuyRow } from '@/components/screens/shopping/ShoppingRow';
import { TIMER_DOCK_SPACE, TimerDock } from '@/components/screens/TimerDock';
import { AppText, ChefButton, Dialog, Logo, Toast, useReduceMotion } from '@/components/ui';
import { useShopping } from '@/data/ShoppingContext';
import { useTimers } from '@/data/TimersContext';
import { color, radius, space } from '@/theme/tokens';

type Drag = { id: string; from: number; to: number };

/** Passage d'un article entre « À acheter » et « Articles cochés » : fondu et resserrement en 200 ms. */
const SECTION_CHANGE = LayoutAnimation.create(200, 'easeInEaseOut', 'opacity');

/** Figma : « Liste » (244:3444) — liste de courses, articles à acheter puis articles cochés. */
export default function ListeScreen() {
  const insets = useSafeAreaInsets();
  const docked = useTimers().timers.length > 0;
  const { items, addItem, rename, toggle, remove, clear, move } = useShopping();
  const toBuy = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const reduceMotion = useReduceMotion();

  // Un article coché ou décoché change de section : les lignes se resserrent au lieu de sauter.
  // Dernier article coché : son trait se trace en arrivant dans « Articles cochés ».
  const [justChecked, setJustChecked] = useState<string | null>(null);
  const toggleSmoothly = (id: string) => {
    if (!reduceMotion) LayoutAnimation.configureNext(SECTION_CHANGE);
    setJustChecked(!reduceMotion && items.some((i) => i.id === id && !i.checked) ? id : null);
    toggle(id);
  };

  const [focusedId, setFocusedId] = useState<string | null>(null);
  // Ligne à mettre en saisie : n change à chaque demande, pour refocaliser une ligne déjà ciblée.
  const [focusRequest, setFocusRequest] = useState<{ id: string; n: number } | null>(null);
  const requestFocus = (id: string) => setFocusRequest((r) => ({ id, n: (r?.n ?? 0) + 1 }));
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

  const startNewItem = () => requestFocus(addItem());

  // Pas d'écran vide : sans article à acheter, une ligne vierge attend la saisie. Elle passe en saisie, clavier
  // ouvert, quand on arrive sur l'onglet ou après « Tout supprimer », pas quand on coche le dernier article.
  const blankId = toBuy.length === 1 && !toBuy[0].label.trim() ? toBuy[0].id : null;
  const focusBlank = useRef(false);
  const latestToBuy = useRef(toBuy);
  latestToBuy.current = toBuy;
  const [arrival, setArrival] = useState(0);
  useEffect(() => {
    if (toBuy.length === 0) addItem();
  }, [toBuy.length, addItem]);
  useFocusEffect(
    useCallback(() => {
      focusBlank.current = true;
      setArrival((n) => n + 1);
      return () => {
        focusBlank.current = false;
        // Les lignes laissées vierges disparaissent quand on quitte l'onglet.
        latestToBuy.current.filter((i) => !i.label.trim()).forEach((i) => remove(i.id));
      };
    }, []),
  );
  useEffect(() => {
    if (!focusBlank.current) return;
    if (blankId) requestFocus(blankId);
    if (blankId || toBuy.length > 0) focusBlank.current = false;
  }, [arrival, blankId, toBuy.length]);

  /** La croix supprime la ligne et passe la saisie à celle du dessous (du dessus pour la dernière). */
  const removeAndFocusNext = (index: number) => {
    const next = toBuy[index + 1] ?? toBuy[index - 1];
    if (!next) {
      // Dernier article : la ligne se vide et reste en saisie.
      rename(toBuy[index].id, '');
      return;
    }
    remove(toBuy[index].id);
    requestFocus(next.id);
  };

  const count = toBuy.filter((i) => i.label.trim()).length;

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
          contentContainerStyle={[styles.content, docked && { paddingBottom: space[16] + TIMER_DOCK_SPACE }]}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!drag}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="overline" color={color.textSecondary}>
                {`${count} article${count > 1 ? 's' : ''}`}
              </AppText>
              {(count > 0 || checked.length > 0) && (
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

            {toBuy.map((item, index) => (
              <ToBuyRow
                key={item.id}
                item={item}
                focused={focusedId === item.id}
                removable={item.id !== blankId}
                focusRequest={focusRequest?.id === item.id ? focusRequest.n : 0}
                dragging={drag?.id === item.id}
                offset={drag?.id === item.id ? dragY : shiftOf(index)}
                onToggle={() => item.label.trim() && toggleSmoothly(item.id)}
                onRename={(label) => rename(item.id, label)}
                onFocus={() => setFocusedId(item.id)}
                onBlur={() => setFocusedId((id) => (id === item.id ? null : id))}
                onSubmit={() => (item.label.trim() ? startNewItem() : Keyboard.dismiss())}
                onRemove={() => removeAndFocusNext(index)}
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
                <CheckedRow
                  key={item.id}
                  item={item}
                  animateStrike={item.id === justChecked}
                  onToggle={() => toggleSmoothly(item.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <TimerDock />

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        style={[styles.toast, docked && { bottom: space[16] + TIMER_DOCK_SPACE }]}
      />

      <Dialog
        visible={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Vider la liste"
        message="Tous les articles de ta liste de courses seront supprimés, cochés ou non."
        confirmLabel="Oui, tout supprimer"
        onConfirm={() => {
          setClearOpen(false);
          clear();
          // Après la fermeture du dialogue, qui rend sinon le focus au bouton « Tout supprimer ».
          setTimeout(() => {
            focusBlank.current = true;
            setArrival((n) => n + 1);
          }, 300);
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
