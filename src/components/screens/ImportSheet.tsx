import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { AppState, Image, Linking, Platform, StyleSheet, View } from 'react-native';

import { AppText, BottomSheet } from '@/components/ui';
import { SOCIAL_LINKS, SOCIALS, socialOf, type ImportRequest, type SocialId } from '@/data/imports';
import { supabase } from '@/data/supabase';
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

  // Le partage vers Toqué demande une app compilée, pas Expo Go : en attendant, au retour dans Toqué après avoir
  // ouvert le réseau, on importe le lien de publication copié (« Copier le lien »). Hors ligne, la publication est
  // simulée.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      const network = awaitingShare.current;
      if (state !== 'active' || !network) return;
      awaitingShare.current = null;
      if (!supabase) return latestStart.current({ method: 'social', network });
      const copied = (await Clipboard.getStringAsync().catch(() => '')).trim();
      const url = copied.match(/https?:\/\/\S+/)?.[0];
      if (url && socialOf(url)) latestStart.current({ method: 'social', network: socialOf(url)!, url });
    });
    return () => sub.remove();
  }, []);

  const openNetwork = async (id: SocialId = network) => {
    const { app, web } = SOCIAL_LINKS[id];
    awaitingShare.current = id;
    // Sur le web, le réseau s'ouvre dans un nouvel onglet : le prototype reste ouvert derrière.
    if (Platform.OS === 'web') return void Linking.openURL(web);
    await Linking.openURL(app).catch(() => Linking.openURL(web));
  };

  // Ouverte directement sur un sous-écran (guide d'import du profil) : pas de retour, juste la croix.
  const back = view === 'menu' || initialStep !== 'menu' ? undefined : () => setView('menu');

  return (
    <BottomSheet visible={visible} onClose={onClose} title={TITLES[view]} onBack={back} closable={view !== 'menu'}>
      {view === 'menu' && (
        <View style={styles.options}>
          <View style={styles.row}>
            {SOCIAL_SOURCES.map((s) => (
              <ImportOption
                key={s.id}
                // Depuis l'accueil, le réseau s'ouvre directement : le guide reste dans le profil.
                onPress={() => openNetwork(s.id)}
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
      {view === 'social' && (
        <SocialImport network={network} onNetworkChange={setNetwork} onOpen={() => openNetwork()} />
      )}
      {view === 'web' && <WebImport onImport={(url) => onStart({ method: 'web', url })} />}
      {view === 'photo' && <PhotoImport onImport={(photo) => onStart({ method: 'photo', ...photo })} />}
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
