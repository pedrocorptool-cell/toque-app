import { useEffect, useRef, useState } from 'react';
import { AppState, Image, Linking, Platform, StyleSheet, View } from 'react-native';

import { AppText, BottomSheet } from '@/components/ui';
import { SOCIAL_LINKS, SOCIALS, type ImportRequest, type SocialId } from '@/data/imports';
import { SOURCES } from '@/data/recipes';
import { space } from '@/theme/tokens';

import { IconOption, ImportOption } from './import/ImportOption';
import { PhotoImport } from './import/PhotoImport';
import { SocialImport } from './import/SocialImport';
import { WebImport } from './import/WebImport';

export type Step = 'menu' | 'social' | 'web' | 'photo';

const TITLES: Record<Step, string> = {
  menu: 'Importer une recette',
  social: 'Importer via',
  web: 'Importer via lien',
  photo: 'Importer via une photo',
};

type ImportSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Lien, publication ou photo choisi : la sheet se ferme et l'écran « Import en cours » prend le relais. */
  onStart: (request: ImportRequest) => void;
  /** Écran d'ouverture : « social » pour le guide d'import du profil. */
  initialStep?: Step;
};

const SOCIAL_SOURCES = SOCIALS.map((id) => ({ ...SOURCES.find((s) => s.id === id)!, id }));

/**
 * Figma : « Bottom Sheet/ Import/ Global » (premier écran), « Bottom Sheet/ Import/ RS » et « Bottom Sheet/
 * Enregistrer/ New » (lien web). La photo n'a pas de maquette. Tout se passe dans la même sheet, la flèche
 * revient au début.
 */
export function ImportSheet({ visible, onClose, onStart, initialStep = 'menu' }: ImportSheetProps) {
  const [view, setView] = useState<Step>('menu');
  const [network, setNetwork] = useState<SocialId>('instagram');
  const awaitingShare = useRef<SocialId | null>(null);

  // La sheet repart du premier écran à chaque ouverture, pas à la fermeture : son contenu reste pendant
  // l'animation.
  useEffect(() => {
    if (visible) setView(initialStep);
    else awaitingShare.current = null;
  }, [visible, initialStep]);

  const latestStart = useRef(onStart);
  latestStart.current = onStart;

  // Prototype : le partage depuis le réseau ne peut pas revenir dans l'app. Au retour dans Toqué après avoir
  // ouvert le réseau, on fait comme si une publication venait d'être partagée.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !awaitingShare.current) return;
      latestStart.current({ method: 'social', network: awaitingShare.current });
      awaitingShare.current = null;
    });
    return () => sub.remove();
  }, []);

  const openNetwork = async () => {
    const { app, web } = SOCIAL_LINKS[network];
    awaitingShare.current = network;
    // Sur le web, le réseau s'ouvre dans un nouvel onglet : le prototype reste ouvert derrière.
    if (Platform.OS === 'web') return void Linking.openURL(web);
    await Linking.openURL(app).catch(() => Linking.openURL(web));
  };

  const back = view === 'menu' ? undefined : () => setView('menu');

  return (
    <BottomSheet visible={visible} onClose={onClose} title={TITLES[view]} onBack={back}>
      {view === 'menu' && (
        <View style={styles.options}>
          <View style={styles.row}>
            {SOCIAL_SOURCES.map((s) => (
              <ImportOption
                key={s.id}
                onPress={() => {
                  setNetwork(s.id);
                  setView('social');
                }}
                style={styles.social}>
                <Image source={s.logo!} style={styles.logo} />
                <AppText>{s.label}</AppText>
              </ImportOption>
            ))}
          </View>
          <View style={styles.row}>
            <IconOption icon="camera" label="Photo" onPress={() => setView('photo')} />
            <IconOption icon="link" label="Lien Web" onPress={() => setView('web')} />
          </View>
        </View>
      )}
      {view === 'social' && <SocialImport network={network} onNetworkChange={setNetwork} onOpen={openNetwork} />}
      {view === 'web' && <WebImport onImport={(url) => onStart({ method: 'web', url })} />}
      {view === 'photo' && <PhotoImport onImport={(uri) => onStart({ method: 'photo', uri })} />}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: space[16],
  },
  social: {
    flex: 1,
    gap: space[8],
    padding: space[12],
  },
  logo: {
    width: 32,
    height: 32,
  },
  row: {
    flexDirection: 'row',
    gap: space[16],
  },
});
