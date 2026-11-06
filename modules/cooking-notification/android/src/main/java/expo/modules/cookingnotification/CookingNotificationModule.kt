package expo.modules.cookingnotification

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Notifications « Recette en cours » d'Android, tenues à jour par l'app (voir src/data/cookingNotification.ts). */
class CookingNotificationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CookingNotification")

    /** Recettes en cours, en JSON (liste de `Entry`), et la sonnerie choisie dans le profil (`den_den`…). */
    Function("update") { entries: String, sound: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CookingNotifications.update(context.applicationContext, entries, sound)
    }
  }
}
