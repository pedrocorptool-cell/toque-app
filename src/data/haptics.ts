import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Vibrations courtes, réservées à quelques moments : rien sur le web, et un échec ne bloque jamais l'action. */
const supported = Platform.OS !== 'web';

export const haptics = {
  /** Quelque chose est arrivé au bout : minuteur terminé, recette importée ou rangée, plat fini. */
  success: () => supported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  /** Petit cran : cocher un article, lancer ou mettre en pause un minuteur, changer d'étape, passer une ligne. */
  selection: () => supported && Haptics.selectionAsync().catch(() => {}),
  /** La ligne qu'on déplace se soulève sous le doigt. */
  lift: () => supported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
};
