import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { CategoryFields, SWATCHES } from '@/components/screens/CategoryFields';
import { AppText, BottomSheet, Button, TextButton } from '@/components/ui';
import { toHashtag, type Category } from '@/data/recipes';
import { color, space, text } from '@/theme/tokens';

/** Figma « Sheet/Suppréssion confirmation » (599:13739) : bouteille renversée de 242 × 115. */
const BOTTLE = require('@/assets/images/illus/bottle.png');

type CategorySheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Catégorie modifiée ; absente pour en créer une. */
  category?: Category;
  onSave: (category: Category) => void;
  onDelete: (category: Category) => void;
};

/**
 * Figma : « Sheet/New catégorie », « Sheet/Modifier catégorie » et « Sheet/Suppréssion confirmation ».
 * La confirmation de suppression remplace le formulaire dans la même sheet : flèche retour et croix, illustration,
 * titre et texte centrés.
 */
export function CategorySheet({ visible, onClose, category, onSave, onDelete }: CategorySheetProps) {
  const [name, setName] = useState('');
  const [swatch, setSwatch] = useState<string>(SWATCHES[0]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(category?.label ?? '');
    setSwatch(category?.dot ?? SWATCHES[0]);
    setConfirming(false);
  }, [visible, category]);

  if (category && confirming) {
    return (
      <BottomSheet visible={visible} onClose={onClose} onBack={() => setConfirming(false)}>
        <Image source={BOTTLE} style={styles.illustration} accessibilityIgnoresInvertColors />
        <AppText style={styles.confirmTitle} accessibilityRole="header">
          {`Supprimer la catégorie ${category.label} ?`}
        </AppText>
        <AppText color={color.textSecondary} style={styles.message}>
          {`Les recettes présentes dans ${category.label} seront conservées. Seule la catégorie est retirée.`}
        </AppText>
        <View style={styles.actions}>
          <Button block icon="trash" label="Supprimer" onPress={() => onDelete(category)} />
          <TextButton label="Annuler" onPress={() => setConfirming(false)} />
        </View>
      </BottomSheet>
    );
  }

  const label = name.trim();
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      closable
      title={category ? 'Modifier la catégorie' : 'Créer une catégorie'}>
      <CategoryFields name={name} onNameChange={setName} swatch={swatch} onSwatchChange={setSwatch} />
      <View style={styles.actions}>
        <Button
          block
          label="Enregistrer"
          disabled={!label}
          onPress={() =>
            onSave({
              id: category?.id ?? `custom-${Date.now()}`,
              label,
              hashtag: category?.label === label ? category.hashtag : toHashtag(label),
              dot: swatch,
            })
          }
        />
        {category && <TextButton tone="danger" icon="trash" label="Supprimer" onPress={() => setConfirming(true)} />}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  illustration: {
    alignSelf: 'center',
    width: 242,
    height: 115,
  },
  // Figma : Zalando Sans Medium 20 / 28, centré.
  confirmTitle: {
    ...text.title,
    lineHeight: 28,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    alignItems: 'center',
    gap: space[24],
  },
});
