import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, LayoutAnimation, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { CheckedRow, LINE_HEIGHT, ROW_GAP, ToBuyRow } from '@/components/screens/shopping/ShoppingRow';
import { AppText, Dialog, Logo, Toast, useReduceMotion, Tappable } from '@/components/ui';
import { useReorder } from '@/components/ui/useReorder';
import { haptics } from '@/data/haptics';
import { useShopping, type ShoppingItem } from '@/data/ShoppingContext';
import { color, radius, space } from '@/theme/tokens';

/** Passage d'un article entre « À acheter » et « Articles cochés » : fondu et resserrement en 200 ms. */
/** Temps laissé pour annuler « Tout supprimer ». */
const UNDO_DELAY = 4000;
const SECTION_CHANGE = LayoutAnimation.create(200, 'easeInEaseOut', 'opacity');

/** Figma : « Liste » (244:3444) — liste de courses, articles à acheter puis articles cochés. */
export default function ListeScreen() {
  const insets = useSafeAreaInsets();
  const { items, addItem, rename, toggle, remove, clear, restore, move } = useShopping();
  const toBuy = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const reduceMotion = useReduceMotion();

  // Un article coché ou décoché change de section : les lignes se resserrent au lieu de sauter.
  // Dernier article coché : son trait se trace en arrivant dans « Articles cochés ».
  const [justChecked, setJustChecked] = useState<string | null>(null);
  const toggleSmoothly = (id: string) => {
    haptics.selection();
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
  // Liste vidée : le toast propose de la remettre pendant UNDO_DELAY, puis l'ancienne liste est oubliée.
  const [cleared, setCleared] = useState<ShoppingItem[] | null>(null);
  useEffect(() => {
    if (!cleared) return;
    const t = setTimeout(() => {
      setCleared(null);
      setToast(null);
    }, UNDO_DELAY);
    return () => clearTimeout(t);
  }, [cleared]);

  // Glisser-déposer par la poignée : la ligne suit le doigt, les autres s'écartent d'une ligne.
  const reorder = useReorder(
    toBuy.map((i) => i.id),
    move,
    ROW_GAP,
    LINE_HEIGHT,
  );

  const startNewItem = () => requestFocus(addItem());

  // Pas d'écran vide : sans article à acheter, une ligne vierge attend la saisie. C'est l'utilisateur qui la
  // touche pour écrire : le clavier ne s'ouvre jamais tout seul (il masquerait le toast de « Tout supprimer »).
  const blankId = toBuy.length === 1 && !toBuy[0].label.trim() ? toBuy[0].id : null;
  const latestToBuy = useRef(toBuy);
  latestToBuy.current = toBuy;
  useEffect(() => {
    if (toBuy.length === 0) addItem();
  }, [toBuy.length, addItem]);
  useFocusEffect(
    useCallback(
      () => () => {
        // Les lignes laissées vierges disparaissent quand on quitte l'onglet.
        latestToBuy.current.filter((i) => !i.label.trim()).forEach((i) => remove(i.id));
      },
      [],
    ),
  );

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
        </View>
        <AppText variant="title" color={color.textOnBrandPrimary}>
          Liste de courses
        </AppText>
      </View>

      <KeyboardAvoidingView style={styles.sheet} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!reorder.dragging}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="overline" color={color.textSecondary}>
                {`${count} article${count > 1 ? 's' : ''}`}
              </AppText>
              {(count > 0 || checked.length > 0) && (
                <Tappable
                  accessibilityRole="button"
                  onPress={() => setClearOpen(true)}
                  hitSlop={space[8]}
                  style={styles.clear}>
                  <Icon name="trash" color={color.actionSecondaryIcon} />
                  <AppText>Tout supprimer</AppText>
                </Tappable>
              )}
            </View>

            {toBuy.map((item, index) => (
              <ToBuyRow
                key={item.id}
                item={item}
                focused={focusedId === item.id}
                removable={item.id !== blankId}
                focusRequest={focusRequest?.id === item.id ? focusRequest.n : 0}
                dragging={reorder.dragging === item.id}
                offset={reorder.offsetOf(item.id, index)}
                onToggle={() => item.label.trim() && toggleSmoothly(item.id)}
                onRename={(label) => rename(item.id, label)}
                onFocus={() => setFocusedId(item.id)}
                onBlur={() => setFocusedId((id) => (id === item.id ? null : id))}
                onSubmit={() => (item.label.trim() ? startNewItem() : Keyboard.dismiss())}
                onRemove={() => removeAndFocusNext(index)}
                onDragStart={() => reorder.start(item.id, index)}
                onDragMove={reorder.move}
                onDragEnd={reorder.end}
                onHeight={(h) => reorder.setHeight(item.id, h)}
              />
            ))}

            <Tappable accessibilityRole="button" onPress={startNewItem} style={styles.add}>
              <Icon name="plus" color={color.textPrimary} />
              <AppText>Ajouter</AppText>
            </Tappable>
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

      <Toast
        message={toast}
        onClose={() => {
          setToast(null);
          setCleared(null);
        }}
        action={
          cleared
            ? {
                label: 'Annuler',
                onPress: () => {
                  restore(cleared);
                  setCleared(null);
                  setToast(null);
                },
              }
            : undefined
        }
        style={styles.toast}
      />

      <Dialog
        visible={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Vider la liste"
        message="Tous les articles de ta liste de courses seront supprimés, cochés ou non."
        confirmLabel="Oui, tout supprimer"
        onConfirm={() => {
          setClearOpen(false);
          setCleared(items);
          setToast('Liste supprimée');
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
  // Même hauteur que la ligne de la home (icône du profil de 40 px) : le logo ne bouge pas d'un onglet à l'autre.
  topRow: {
    minHeight: 40,
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
  toast: {
    position: 'absolute',
    left: space[16],
    right: space[16],
    bottom: space[16],
  },
});
