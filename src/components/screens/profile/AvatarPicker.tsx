import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Logo, TextButton } from '@/components/ui';
import { type Avatar, type AvatarId } from '@/data/profile';
import { color, space } from '@/theme/tokens';

import { AvatarChooser } from './AvatarChooser';

type AvatarPickerProps = {
  visible: boolean;
  initial: Avatar;
  onClose: () => void;
  onSave: (avatar: Avatar) => void;
};

/** Figma : « Profil/ Compte » (choix d'avatar) — carrousel d'avatars Toqué et couleur de fond, plein écran. */
export function AvatarPicker({ visible, initial, onClose, onSave }: AvatarPickerProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top + space[24], paddingBottom: insets.bottom + space[16] }]}>
        <View style={styles.topRow}>
          <Logo />
        </View>
        {/* Monté à chaque ouverture : le choix repart de l'avatar actuel. */}
        {visible && <PickerBody initial={initial} onClose={onClose} onSave={onSave} />}
      </View>
    </Modal>
  );
}

function PickerBody({ initial, onClose, onSave }: Pick<AvatarPickerProps, 'initial' | 'onClose' | 'onSave'>) {
  const start = initial.kind === 'toque' ? initial : { id: 'onion' as AvatarId, background: color.accentCreme };
  const [avatarId, setAvatarId] = useState(start.id);
  const [background, setBackground] = useState(start.background);

  return (
    <>
      <AvatarChooser
        avatarId={avatarId}
        onAvatarChange={setAvatarId}
        background={background}
        onBackgroundChange={setBackground}>
        <View style={styles.texts}>
          <AppText variant="headline" color={color.textOnBrandPrimary} style={styles.center}>
            Choisis un avatar Toqué !
          </AppText>
          <AppText color={color.textOnBrandSecondary} style={[styles.center, styles.message]}>
            Fais défiler les avatars et choisis une couleur de fond.
          </AppText>
        </View>
      </AvatarChooser>

      <View style={styles.actions}>
        <Button
          block
          variant="secondary"
          icon="bookmark"
          label="Enregistrer"
          onPress={() => onSave({ kind: 'toque', id: avatarId, background })}
        />
        <TextButton tone="onBrand" label="Annuler" onPress={onClose} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
    backgroundColor: color.bgBrandPage,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  texts: {
    alignItems: 'center',
    gap: space[16],
    maxWidth: 285,
  },
  center: {
    textAlign: 'center',
  },
  message: {
    lineHeight: 24,
  },
  actions: {
    alignItems: 'center',
    gap: space[24],
  },
});
