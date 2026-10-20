import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { color, space } from '@/theme/tokens';

import { IconOption } from './ImportOption';

const PICKER: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };

/** Hors maquette : appareil photo ou galerie, mêmes cartes que le premier écran d'import. */
export function PhotoImport({ onImport }: { onImport: (uri: string) => void }) {
  const [denied, setDenied] = useState(false);

  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync().catch(() => null);
    if (permission && !permission.granted && !permission.canAskAgain) return setDenied(true);
    // Pas d'appareil photo (web, simulateur) : la galerie prend le relais.
    const result = await ImagePicker.launchCameraAsync(PICKER).catch(() => ImagePicker.launchImageLibraryAsync(PICKER));
    if (!result.canceled) onImport(result.assets[0].uri);
  };

  const fromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER);
    if (!result.canceled) onImport(result.assets[0].uri);
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
