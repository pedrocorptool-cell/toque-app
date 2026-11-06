import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { AddRow, EDIT_LINE, EditRow } from '@/components/screens/edit/EditRow';
import { StepTimerSheet } from '@/components/screens/edit/StepTimerSheet';
import { ImportLoading } from '@/components/screens/import/ImportLoading';
import { AppText, ClearButton, Dialog, IconButton, Tappable } from '@/components/ui';
import { moveItem, useReorder } from '@/components/ui/useReorder';
import { isStoredImage, storeRecipeImage } from '@/data/imports';
import { creatorOf, creatorsOf, formatIngredient, type Ingredient, type Recipe, type Step } from '@/data/recipes';
import { useRecipes } from '@/data/RecipesContext';
import { goBack } from '@/navigation/goBack';
import { color, radius, shadow, space, text } from '@/theme/tokens';

type IngredientRow = {
  id: string;
  text: string;
  /** Index dans la recette d'origine, pour les étapes. */ origin?: number;
};
type StepRow = { id: string; text: string; timer?: number; ingredients?: number[] };
type CreatorValue = { id: string; name: string; avatar?: ImageSourcePropType };

/** Écart entre deux lignes (sous le filet), et hauteur d'une ligne pas encore mesurée. */
const ROW_GAP = space[16];
const ROW_FALLBACK = EDIT_LINE + space[16];

let nextId = 0;
const newId = () => `row-${++nextId}`;

/** « 20 cl de bouillon » → 20, « cl de bouillon » ; « Huile d'olive » reste sans quantité. */
function parseIngredient(line: string): Ingredient {
  const match = line.trim().match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  return match ? { qty: Number(match[1].replace(',', '.')), name: match[2] } : { name: line.trim() };
}

/** Minuteur d'une étape, comme dans la maquette : « 02h00 », « 10 min », « 45 s ». */
function shortDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
  return [m && `${m} min`, s && `${s} s`].filter(Boolean).join(' ');
}

/** Figma « Modifier la recette » (Tests Action Bar) : image, nom, créateur, ingrédients et étapes. */
export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes } = useRecipes();
  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) return null;
  return <EditRecipe recipe={recipe} recipes={recipes} />;
}

function EditRecipe({ recipe, recipes }: { recipe: Recipe; recipes: Recipe[] }) {
  const insets = useSafeAreaInsets();
  const { updateRecipe } = useRecipes();

  const [image, setImage] = useState(recipe.image);
  const [title, setTitle] = useState(recipe.title);
  const [creator, setCreator] = useState<CreatorValue>(() => creatorOf(recipe));
  const [creatorText, setCreatorText] = useState(creator.name);
  const [creatorOpen, setCreatorOpen] = useState(false);
  // Champ en saisie : la croix d'effacement s'affiche à son bout.
  const [focusedField, setFocusedField] = useState<'title' | 'creator' | null>(null);
  // La quantité reste dans le texte, aux parts de la recette : « 20 cl de bouillon de volaille ».
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() =>
    recipe.ingredients.map((i, origin) => ({
      id: newId(),
      text: formatIngredient(i, recipe.servings, recipe.servings),
      origin,
    })),
  );
  const [steps, setSteps] = useState<StepRow[]>(() =>
    recipe.steps.map((s) => ({ id: newId(), text: s.text, timer: s.timer, ingredients: s.ingredients })),
  );
  const [dirty, setDirty] = useState(false);
  const touch = () => setDirty(true);

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ id: string; n: number } | null>(null);
  const requestFocus = (rowId: string) => setFocusRequest((r) => ({ id: rowId, n: (r?.n ?? 0) + 1 }));
  const blur = (rowId: string) => setFocusedId((f) => (f === rowId ? null : f));

  const ingredientDrag = useReorder(
    ingredients.map((r) => r.id),
    (rowId, to) => (setIngredients((list) => moveItem(list, rowId, to)), touch()),
    ROW_GAP,
    ROW_FALLBACK,
  );
  const stepDrag = useReorder(
    steps.map((r) => r.id),
    (rowId, to) => (setSteps((list) => moveItem(list, rowId, to)), touch()),
    ROW_GAP,
    ROW_FALLBACK,
  );

  const [timerStep, setTimerStep] = useState<StepRow | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const cancelled = useRef(false);

  // Créateurs déjà connus dans l'espace, filtrés par ce qu'on tape.
  const knownCreators = useMemo(() => creatorsOf(recipes).filter((c) => c.name.trim()), [recipes]);
  const suggestions = knownCreators.filter(
    (c) =>
      c.id !== creator.id &&
      (creatorText === creator.name || c.name.toLowerCase().includes(creatorText.trim().toLowerCase())),
  );
  const pickCreator = (next: CreatorValue) => {
    setCreator(next);
    setCreatorText(next.name);
    setCreatorOpen(false);
    Keyboard.dismiss();
    touch();
  };
  /** Créateur saisi : un créateur connu du même nom, sinon un nouveau (« Maman »). Champ vide : celui d'avant. */
  const typedCreator = (): CreatorValue => {
    const name = creatorText.trim();
    if (!name || name === creator.name) return creator;
    return knownCreators.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? { id: name, name };
  };
  const commitCreatorText = () => {
    setCreatorOpen(false);
    const next = typedCreator();
    setCreatorText(next.name);
    if (next === creator) return;
    setCreator(next);
    touch();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage({ uri: result.assets[0].uri });
      touch();
    }
  };

  const addIngredient = (after?: number) => {
    const row = { id: newId(), text: '' };
    setIngredients((list) => {
      const at = after === undefined ? list.length : after + 1;
      return [...list.slice(0, at), row, ...list.slice(at)];
    });
    requestFocus(row.id);
    touch();
  };
  const addStep = () => {
    const row = { id: newId(), text: '' };
    setSteps((list) => [...list, row]);
    requestFocus(row.id);
    touch();
  };

  const save = async () => {
    Keyboard.dismiss();
    // Ingrédients : lignes vides retirées ; les étapes gardent les leurs, à leur nouvelle place.
    const kept = ingredients.filter((r) => r.text.trim());
    const newIndex = new Map(kept.flatMap((r, i) => (r.origin === undefined ? [] : [[r.origin, i] as const])));
    const nextSteps: Step[] = steps
      .filter((s) => s.text.trim())
      .map((s) => ({
        text: s.text.trim(),
        ...(s.timer ? { timer: s.timer } : {}),
        ...(s.ingredients
          ? { ingredients: s.ingredients.flatMap((o) => (newIndex.has(o) ? [newIndex.get(o)!] : [])) }
          : {}),
      }));

    let nextImage = image;
    const uri = typeof image === 'object' && image && 'uri' in image ? image.uri : undefined;
    // Nouvelle photo : elle part tout de suite dans le stockage de l'espace, pour que les autres membres la voient.
    if (image !== recipe.image && uri && !isStoredImage(uri)) {
      cancelled.current = false;
      setSaving(true);
      const stored = await storeRecipeImage(uri).catch(() => null);
      setSaving(false);
      if (cancelled.current) return;
      if (stored) nextImage = { uri: stored };
    }

    // « Enregistrer » touché sans quitter le champ du créateur : le nom saisi compte quand même.
    const creator = typedCreator();
    const avatar = creator.avatar as { uri?: string } | undefined;
    updateRecipe(recipe.id, {
      title: title.trim() || recipe.title,
      image: nextImage,
      creator: creator.id,
      creatorAvatar: creator.id === recipe.creator ? recipe.creatorAvatar : avatar?.uri,
      ingredients: kept.map((r) => parseIngredient(r.text)),
      steps: nextSteps,
    });
    goBack();
  };

  const close = () => (dirty ? setLeaveOpen(true) : goBack());

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space[24] }]}>
        <IconButton icon="close" accessibilityLabel="Annuler" onPress={close} />
        <AppText variant="title" color={color.textOnBrandPrimary} accessibilityRole="header">
          Modifier la recette
        </AppText>
        <IconButton icon="check" accessibilityLabel="Enregistrer" onPress={save} />
      </View>

      <KeyboardAvoidingView style={styles.sheet} behavior="padding">
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: space[16] + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!ingredientDrag.dragging && !stepDrag.dragging}>
          {/* La liste des créateurs passe par-dessus les cartes suivantes. */}
          <View style={[styles.card, styles.raised]}>
            <View style={styles.group}>
              <AppText variant="overline" color={color.textSecondary}>
                Image
              </AppText>
              <Tappable
                feedback="card"
                accessibilityRole="button"
                accessibilityLabel="Changer la photo"
                onPress={pickImage}
                style={styles.photoButton}>
                <Image source={image} style={styles.photo} accessibilityIgnoresInvertColors />
                <View style={styles.badge}>
                  <Icon name="camera" size={16} color={color.actionSecondaryIcon} />
                </View>
              </Tappable>
            </View>

            <View style={styles.group}>
              <AppText variant="overline" color={color.textSecondary} nativeID="nom">
                Nom
              </AppText>
              <View style={[styles.field, styles.fieldRow]}>
                <TextInput
                  value={title}
                  onChangeText={(v) => (setTitle(v), touch())}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                  accessibilityLabelledBy="nom"
                  accessibilityLabel="Nom"
                  returnKeyType="done"
                  style={styles.fieldInput}
                />
                <ClearButton visible={focusedField === 'title' && !!title} onClear={() => (setTitle(''), touch())} />
              </View>
            </View>

            <View style={[styles.group, styles.raised]}>
              <AppText variant="overline" color={color.textSecondary} nativeID="createur">
                Créateur
              </AppText>
              <View style={[styles.field, styles.creatorField]}>
                {creator.avatar && creatorText === creator.name && (
                  <Image source={creator.avatar} style={styles.avatar} />
                )}
                <TextInput
                  value={creatorText}
                  onChangeText={setCreatorText}
                  onFocus={() => (setCreatorOpen(true), setFocusedField('creator'))}
                  onBlur={() => (setFocusedField(null), commitCreatorText())}
                  onSubmitEditing={commitCreatorText}
                  accessibilityLabelledBy="createur"
                  accessibilityLabel="Créateur"
                  returnKeyType="done"
                  style={styles.creatorInput}
                />
                <ClearButton visible={focusedField === 'creator' && !!creatorText} onClear={() => setCreatorText('')} />
              </View>
              {creatorOpen && suggestions.length > 0 && (
                <View style={styles.dropdown}>
                  {suggestions.map((c) => (
                    <Tappable
                      key={c.id}
                      accessibilityRole="button"
                      onPress={() => pickCreator(c)}
                      // Sur le web, l'appui ferait perdre le focus au champ, et la liste disparaîtrait avant le clic.
                      {...(Platform.OS === 'web' && {
                        onMouseDown: (e: { preventDefault: () => void }) => e.preventDefault(),
                      })}
                      style={styles.option}>
                      {c.avatar ? (
                        <Image source={c.avatar} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarEmpty]} />
                      )}
                      <AppText numberOfLines={1} style={styles.flex}>
                        {c.name}
                      </AppText>
                    </Tappable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.card}>
            <AppText variant="overline" color={color.textSecondary}>
              Ingrédients
            </AppText>
            <View>
              {ingredients.map((row, index) => (
                <EditRow
                  key={row.id}
                  value={row.text}
                  placeholder="Nouvel ingrédient"
                  focused={focusedId === row.id}
                  focusRequest={focusRequest?.id === row.id ? focusRequest.n : 0}
                  dragging={ingredientDrag.dragging === row.id}
                  offset={ingredientDrag.offsetOf(row.id, index)}
                  onChange={(v) => {
                    setIngredients((list) => list.map((r) => (r.id === row.id ? { ...r, text: v } : r)));
                    touch();
                  }}
                  onFocus={() => setFocusedId(row.id)}
                  onBlur={() => blur(row.id)}
                  onSubmit={() => (row.text.trim() ? addIngredient(index) : Keyboard.dismiss())}
                  onRemove={() => {
                    setIngredients((list) => list.filter((r) => r.id !== row.id));
                    touch();
                  }}
                  onDragStart={() => ingredientDrag.start(row.id, index)}
                  onDragMove={ingredientDrag.move}
                  onDragEnd={ingredientDrag.end}
                  onHeight={(h) => ingredientDrag.setHeight(row.id, h)}
                />
              ))}
              <AddRow label="Ajouter un ingrédient" onPress={() => addIngredient()} />
            </View>
          </View>

          <View style={styles.card}>
            <AppText variant="overline" color={color.textSecondary}>
              Étapes
            </AppText>
            <View>
              {steps.map((row, index) => (
                <EditRow
                  key={row.id}
                  value={row.text}
                  placeholder="Nouvelle étape"
                  focused={focusedId === row.id}
                  focusRequest={focusRequest?.id === row.id ? focusRequest.n : 0}
                  dragging={stepDrag.dragging === row.id}
                  offset={stepDrag.offsetOf(row.id, index)}
                  onChange={(v) => {
                    setSteps((list) => list.map((r) => (r.id === row.id ? { ...r, text: v } : r)));
                    touch();
                  }}
                  onFocus={() => setFocusedId(row.id)}
                  onBlur={() => blur(row.id)}
                  onSubmit={() => Keyboard.dismiss()}
                  onRemove={() => {
                    setSteps((list) => list.filter((r) => r.id !== row.id));
                    touch();
                  }}
                  onDragStart={() => stepDrag.start(row.id, index)}
                  onDragMove={stepDrag.move}
                  onDragEnd={stepDrag.end}
                  onHeight={(h) => stepDrag.setHeight(row.id, h)}>
                  {row.timer ? (
                    <Tappable
                      accessibilityRole="button"
                      accessibilityLabel={`Modifier le minuteur, ${shortDuration(row.timer)}`}
                      onPress={() => setTimerStep(row)}
                      style={styles.timer}>
                      <Icon name="alarm" size={16} color={color.tagTimeText} />
                      <AppText variant="caption" color={color.tagTimeText}>
                        {shortDuration(row.timer)}
                      </AppText>
                    </Tappable>
                  ) : (
                    <Tappable accessibilityRole="button" onPress={() => setTimerStep(row)} style={styles.addTimer}>
                      <AppText variant="label" color={color.textSecondary}>
                        + Minuteur
                      </AppText>
                    </Tappable>
                  )}
                </EditRow>
              ))}
              <AddRow label="Ajouter une étape" onPress={addStep} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StepTimerSheet
        visible={timerStep !== null}
        initial={timerStep?.timer}
        onClose={() => setTimerStep(null)}
        onSave={(seconds) => {
          setSteps((list) => list.map((r) => (r.id === timerStep?.id ? { ...r, timer: seconds } : r)));
          setTimerStep(null);
          touch();
        }}
        onRemove={() => {
          setSteps((list) => list.map((r) => (r.id === timerStep?.id ? { ...r, timer: undefined } : r)));
          setTimerStep(null);
          touch();
        }}
      />

      <Dialog
        visible={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Quitter sans enregistrer ?"
        message="Tes modifications seront perdues."
        confirmLabel="Quitter"
        onConfirm={() => {
          setLeaveOpen(false);
          goBack();
        }}
      />

      <ImportLoading
        visible={saving}
        title="Modification de la recette"
        message=""
        onCancel={() => {
          cancelled.current = true;
          setSaving(false);
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: color.bgPage,
    overflow: 'hidden',
  },
  content: {
    gap: space[24],
    padding: space[16],
  },
  card: {
    gap: space[16],
    padding: space[16],
    borderRadius: radius.lg,
    backgroundColor: color.bgSurface,
  },
  raised: {
    zIndex: 2,
  },
  group: {
    gap: space[16],
  },
  photoButton: {
    alignSelf: 'flex-start',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: color.bgSkeleton,
  },
  badge: {
    position: 'absolute',
    right: -18,
    bottom: 0,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderDefault,
    backgroundColor: color.bgSurface,
  },
  field: {
    ...text.body,
    height: 48,
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderDefault,
    backgroundColor: color.bgSurface,
    color: color.textPrimary,
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  creatorField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingLeft: space[8],
  },
  // Champ dans une pastille : le texte prend la place, la croix d'effacement au bout.
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  fieldInput: {
    ...text.body,
    flex: 1,
    height: '100%',
    padding: 0,
    color: color.textPrimary,
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  creatorInput: {
    ...text.body,
    flex: 1,
    height: '100%',
    paddingLeft: space[8],
    color: color.textPrimary,
    ...(Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)),
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarEmpty: {
    backgroundColor: color.bgSkeleton,
  },
  // Figma « Dropdown » : carte blanche sous le champ, un créateur par ligne.
  dropdown: {
    position: 'absolute',
    top: 15 + space[16] + 48 + space[4],
    left: 0,
    right: 0,
    gap: space[16],
    padding: space[16],
    borderRadius: radius.xl,
    backgroundColor: color.bgSurface,
    ...shadow.floating,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  flex: {
    flex: 1,
  },
  // Figma : pastille bleue du minuteur d'une étape, ou « + Minuteur » en pointillés quand il n'y en a pas.
  timer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    padding: space[4],
    borderRadius: radius.xl,
    backgroundColor: color.tagTimeBg,
  },
  addTimer: {
    alignSelf: 'flex-start',
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.borderDefault,
  },
});
