import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Linking, Platform, StyleSheet, View } from 'react-native';

import { AppText, BottomSheet } from '@/components/ui';
import { importedRecipe, SOCIAL_LINKS, type ImportRequest, type SocialId } from '@/data/imports';
import { SOURCES, type Recipe } from '@/data/recipes';
import { space } from '@/theme/tokens';

import { ImportProgress } from './import/ImportProgress';
import { IconOption, ImportOption } from './import/ImportOption';
import { PhotoImport } from './import/PhotoImport';
import { SocialImport } from './import/SocialImport';
import { WebImport } from './import/WebImport';

type Step = 'menu' | 'social' | 'web' | 'photo' | 'progress';

const TITLES: Record<Step, string> = {
  menu: 'Importer une recette',
  social: 'Importer via',
  web: 'Importer via un lien',
  photo: 'Importer via une photo',
  progress: 'Import en cours',
};

type ImportSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Recette prête, une fois la lecture simulée terminée. */
  onImported: (recipe: Recipe) => void;
};

const SOCIAL_LOGOS = (['facebook', 'instagram', 'tiktok'] as const).map((id) => SOURCES.find((s) => s.id === id)!);

/**
 * Figma : « Bottom Sheet/ Import » (premier écran) et « Bottom Sheet/ Import/ RS ». Le lien web, la photo
 * et l'import en cours n'ont pas de maquette. Tout se passe dans la même sheet, la flèche revient au début.
 */
export function ImportSheet({ visible, onClose, onImported }: ImportSheetProps) {
  const [view, setView] = useState<Step>('menu');
  const [network, setNetwork] = useState<SocialId>('instagram');
  const [request, setRequest] = useState<ImportRequest | null>(null);
  const awaitingShare = useRef<SocialId | null>(null);

  // La sheet repart du premier écran à chaque ouverture, pas à la fermeture : son contenu reste pendant
  // l'animation.
  const open = useRef(visible);
  open.current = visible;
  useEffect(() => {
    if (visible) setView('menu');
    else awaitingShare.current = null;
  }, [visible]);

  const start = (next: ImportRequest) => {
    setRequest(next);
    setView('progress');
  };

  // Prototype : le partage depuis le réseau ne peut pas revenir dans l'app. Au retour dans Toqué après avoir
  // ouvert le réseau, on fait comme si une publication venait d'être partagée.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !awaitingShare.current) return;
      start({ method: 'social', network: awaitingShare.current });
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

  const finish = useCallback(() => {
    // Sheet fermée pendant la lecture : l'import est abandonné.
    if (request && open.current) onImported(importedRecipe(request));
  }, [request, onImported]);

  const back = view === 'menu' || view === 'progress' ? undefined : () => setView('menu');

  return (
    <BottomSheet visible={visible} onClose={onClose} title={TITLES[view]} onBack={back}>
      {view === 'menu' && (
        <View style={styles.options}>
          <ImportOption onPress={() => setView('social')} style={styles.social}>
            <View style={styles.logos}>
              {SOCIAL_LOGOS.map((s, i) => (
                <Image key={s.id} source={s.logo!} style={[styles.logo, i > 0 && styles.logoOverlap]} />
              ))}
            </View>
            <AppText>Réseaux sociaux</AppText>
          </ImportOption>
          <View style={styles.row}>
            <IconOption icon="camera" label="Photo" onPress={() => setView('photo')} />
            <IconOption icon="link" label="Lien Web" onPress={() => setView('web')} />
          </View>
        </View>
      )}
      {view === 'social' && <SocialImport network={network} onNetworkChange={setNetwork} onOpen={openNetwork} />}
      {view === 'web' && <WebImport onImport={(url) => start({ method: 'web', url })} />}
      {view === 'photo' && <PhotoImport onImport={(uri) => start({ method: 'photo', uri })} />}
      {view === 'progress' && request && <ImportProgress request={request} onDone={finish} />}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: space[16],
  },
  social: {
    gap: space[8],
    paddingVertical: space[16],
  },
  logos: {
    flexDirection: 'row',
  },
  logo: {
    width: 24,
    height: 24,
  },
  logoOverlap: {
    marginLeft: -space[8],
  },
  row: {
    flexDirection: 'row',
    gap: space[16],
  },
});
