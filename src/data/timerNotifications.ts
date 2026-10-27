import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { TimerSoundId } from './profile';

/** Les notifications locales n'existent que sur téléphone ; sur le web, l'app sonne seule quand elle est ouverte. */
const supported = Platform.OS !== 'web';

// App au premier plan : la sheet de fin de minuteur sonne déjà, la notification reste silencieuse et cachée.
if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

let permission: Promise<boolean> | null = null;

/** iOS ne pose la question qu'une fois : on la pose au premier minuteur lancé, pas à l'ouverture de l'app. */
function allowed() {
  permission ??= Notifications.getPermissionsAsync()
    .then((current) => (current.granted ? current : Notifications.requestPermissionsAsync()))
    .then((result) => result.granted)
    .catch(() => false);
  return permission;
}

/**
 * Programme la notification de fin d'un minuteur, pour qu'il sonne app fermée ou écran verrouillé.
 * Le son est la sonnerie choisie dans le profil, en .wav (format accepté par iOS pour les notifications) ;
 * Expo Go, qui n'embarque pas ces fichiers, joue le son par défaut.
 */
export async function scheduleTimerEnd(id: string, seconds: number, body: string, sound: TimerSoundId) {
  if (!supported || seconds <= 0 || !(await allowed())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: 'Minuteur terminé', body, sound: `${sound}.wav` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  }).catch(() => {});
}

export function cancelTimerEnd(id: string) {
  if (!supported) return;
  Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
