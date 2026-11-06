import { requireOptionalNativeModule } from 'expo';

/** Une recette en cours, envoyée à la notification Android. */
export type CookingNotificationEntry = {
  id: string;
  title: string;
  /** « Étape 4 », sous le nom de la recette. */
  step: string;
  /** Photo de la recette : adresse en ligne, fichier ou ressource de l'app. */
  image?: string;
  /** Lien ouvert au toucher (`toqueapp://pas-a-pas/…`). */
  link: string;
  /** Minuteur qui tourne : heure de fin, en ms. */
  endsAt?: number;
  /** Minuteur en pause : temps restant, déjà écrit (« 00:03:17 »). */
  still?: string;
  /** Minuteur arrivé à zéro : « 00:00:00 » clignote. */
  ringing?: boolean;
};

type NativeModule = { update(entries: string, sound: string): void };

/** Absent dans Expo Go, sur iOS et sur le web : l'app n'affiche alors pas de notification « Recette en cours ». */
const native = requireOptionalNativeModule<NativeModule>('CookingNotification');

export const cookingNotificationAvailable = native !== null;

export function updateCookingNotification(entries: CookingNotificationEntry[], sound: string) {
  native?.update(JSON.stringify(entries), sound);
}
