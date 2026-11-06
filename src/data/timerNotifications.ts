import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import type { TimerSoundId } from './profile';

/** Les notifications locales n'existent que sur téléphone ; sur le web, l'app sonne seule quand elle est ouverte. */
let loaded: typeof NotificationsModule | null | undefined;

/**
 * Le module des notifications, chargé au premier besoin. Certaines versions d'Expo Go n'embarquent pas tous ses
 * modules natifs et le chargement échoue : l'app continue alors sans notifications (le minuteur sonne app ouverte).
 */
function notifications(): typeof NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  loaded = null;
  // Expo Go sur Android n'embarque plus tous les modules natifs des notifications : on ne les y charge pas.
  if (Platform.OS === 'web' || (Platform.OS === 'android' && isRunningInExpoGo())) return loaded;
  try {
    const module: typeof NotificationsModule = require('expo-notifications');
    // App au premier plan : la sheet de fin de minuteur sonne déjà, la notification reste silencieuse et cachée.
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    loaded = module;
  } catch {
    // Module natif absent : pas de notifications.
  }
  return loaded;
}

/** `undetermined` : iOS n'a encore rien demandé, le dialogue « Être prévenu quand c'est prêt » peut s'afficher. */
export type NotificationPermission = 'undetermined' | 'granted' | 'denied';

export async function notificationPermission(): Promise<NotificationPermission> {
  const Notifications = notifications();
  if (!Notifications) return 'denied';
  const current = await Notifications.getPermissionsAsync().catch(() => null);
  if (!current) return 'denied';
  return current.granted ? 'granted' : current.canAskAgain ? 'undetermined' : 'denied';
}

/** Demande d'iOS, lancée par « Autoriser » : elle ne s'affiche qu'une fois par installation. */
export async function askNotificationPermission(): Promise<NotificationPermission> {
  const Notifications = notifications();
  if (!Notifications) return 'denied';
  const result = await Notifications.requestPermissionsAsync().catch(() => null);
  return result?.granted ? 'granted' : 'denied';
}

/**
 * Programme la notification de fin d'un minuteur, pour qu'il sonne app fermée ou écran verrouillé.
 * Le son est la sonnerie choisie dans le profil, en .wav (format accepté par iOS pour les notifications) ;
 * Expo Go, qui n'embarque pas ces fichiers, joue le son par défaut.
 */
export async function scheduleTimerEnd(id: string, seconds: number, body: string, sound: TimerSoundId) {
  const Notifications = notifications();
  if (!Notifications || seconds <= 0) return;
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
  notifications()
    ?.cancelScheduledNotificationAsync(id)
    .catch(() => {});
}
