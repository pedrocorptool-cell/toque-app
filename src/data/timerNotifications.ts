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

/** `undetermined` : iOS n'a encore rien demandé, le dialogue « Être prévenu quand c'est prêt » peut s'afficher. */
export type NotificationPermission = 'undetermined' | 'granted' | 'denied';

export async function notificationPermission(): Promise<NotificationPermission> {
  if (!supported) return 'denied';
  const current = await Notifications.getPermissionsAsync().catch(() => null);
  if (!current) return 'denied';
  return current.granted ? 'granted' : current.canAskAgain ? 'undetermined' : 'denied';
}

/** Demande d'iOS, lancée par « Autoriser » : elle ne s'affiche qu'une fois par installation. */
export async function askNotificationPermission(): Promise<NotificationPermission> {
  if (!supported) return 'denied';
  const result = await Notifications.requestPermissionsAsync().catch(() => null);
  return result?.granted ? 'granted' : 'denied';
}

/**
 * Programme la notification de fin d'un minuteur, pour qu'il sonne app fermée ou écran verrouillé.
 * Le son est la sonnerie choisie dans le profil, en .wav (format accepté par iOS pour les notifications) ;
 * Expo Go, qui n'embarque pas ces fichiers, joue le son par défaut.
 */
export async function scheduleTimerEnd(id: string, seconds: number, body: string, sound: TimerSoundId) {
  if (!supported || seconds <= 0) return;
  // Android n'accepte que des minuscules et des « _ » dans le nom des ressources : den-den.wav devient den_den.wav.
  const file = sound.replace(/-/g, '_');
  // Sur Android, le son se règle par canal de notification, un canal par sonnerie.
  const channelId = `timer_${file}`;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Fin des minuteurs',
      importance: Notifications.AndroidImportance.HIGH,
      sound: `${file}.wav`,
    }).catch(() => {});
  }
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: 'Minuteur terminé', body, sound: `${file}.wav` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId },
  }).catch(() => {});
}

export function cancelTimerEnd(id: string) {
  if (!supported) return;
  Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
