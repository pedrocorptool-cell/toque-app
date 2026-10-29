import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { color, space } from '@/theme/tokens';

import { IconOption } from './ImportOption';

// La photo part en base64 vers l'IA : une qualité moyenne suffit à lire le texte et allège l'envoi.
const PICKER: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5, base64: true };

export type PickedPhoto = { uri: string; base64?: string; mimeType?: string };
const picked = (asset: ImagePicker.ImagePickerAsset): PickedPhoto => ({
  uri: asset.uri,
  base64: asset.base64 ?? undefined,
  mimeType: asset.mimeType ?? undefined,
});

/** Hors maquette : appareil photo ou galerie, mêmes cartes que le premier écran d'import. */
export function PhotoImport({ onImport }: { onImport: (photo: PickedPhoto) => void }) {
  const [denied, setDenied] = useState(false);

  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync().catch(() => null);
    if (permission && !permission.granted && !permission.canAskAgain) return setDenied(true);
    // Pas d'appareil photo (web, simulateur) : la galerie prend le relais.
    const result = await ImagePicker.launchCameraAsync(PICKER).catch(() => ImagePicker.launchImageLibraryAsync(PICKER));
    if (!result.canceled) onImport(picked(result.assets[0]));
  };

  const fromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER);
    if (!result.canceled) onImport(picked(result.assets[0]));
  };

  return (
    <>
      <AppText color={color.textSecondary}>
        {'Une page de livre, une fiche manuscrite ou une capture d’écran : Toqué en tire les ingrédients ' +
          'et les étapes.'}
      </AppText>
      <View style={styles.row}>
        <IconOption icon="camera" label="Prendre une photo" onPress={fromCamera} />
        <IconOption icon="images" label="Galerie" onPress={fromLibrary} />
      </View>
      {denied && (
        <AppText variant="label" color={color.feedbackDanger}>
          {'Toqué n’a pas accès à l’appareil photo. Autorise-le dans les réglages, ou choisis une photo ' +
            'dans ta galerie.'}
        </AppText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space[16],
  },
});
