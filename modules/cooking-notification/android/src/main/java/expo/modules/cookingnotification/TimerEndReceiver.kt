package expo.modules.cookingnotification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Heure de fin d'un minuteur, app fermée ou non : la notification passe en « sonnerie ». */
class TimerEndReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val pending = goAsync()
    CookingNotifications.refresh(context.applicationContext) { pending.finish() }
  }
}
