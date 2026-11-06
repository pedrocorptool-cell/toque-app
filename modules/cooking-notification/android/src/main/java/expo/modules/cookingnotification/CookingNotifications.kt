package expo.modules.cookingnotification

import android.annotation.TargetApi
import android.app.ActivityManager
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import org.json.JSONArray
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/** Une recette en cours, telle que l'app l'envoie. */
private data class Entry(
  val id: String,
  val title: String,
  val step: String,
  val image: String?,
  val link: String,
  /** Minuteur qui tourne : heure de fin (ms depuis 1970). */
  val endsAt: Long?,
  /** Minuteur en pause : texte figé du temps restant. */
  val still: String?,
  val ringing: Boolean,
)

/**
 * Figma « Notif Android » : une notification par recette en cours, regroupées (et dépliables) dès qu'il y en a deux.
 * Le compte à rebours est tenu par Android ; à l'heure de fin, une alarme fait passer la notification en sonnerie.
 * Les canaux de notification n'existent qu'à partir d'Android 8 : avant, rien ne s'affiche.
 */
@TargetApi(Build.VERSION_CODES.O)
object CookingNotifications {
  private const val PREFS = "toque.cooking_notification"
  private const val GROUP = "toque.cooking"
  private const val SUMMARY_ID = 0x70C0
  private const val QUIET_CHANNEL = "cooking"
  private const val HOUR = 3_600_000L
  private const val ACTION_TIMER_END = "expo.modules.cookingnotification.TIMER_END"

  // Une seule file : les mises à jour s'appliquent dans l'ordre, et le chargement des photos ne bloque pas l'app.
  private val queue = Executors.newSingleThreadExecutor()

  private val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O

  fun update(context: Context, json: String, sound: String) {
    if (!supported) return
    prefs(context).edit().putString("entries", json).putString("sound", sound).apply()
    queue.execute { runCatching { render(context, json, sound) } }
  }

  fun refresh(context: Context, done: () -> Unit) {
    if (!supported) return done()
    queue.execute {
      try {
        val prefs = prefs(context)
        render(context, prefs.getString("entries", "[]")!!, prefs.getString("sound", "timer")!!)
      } catch (_: Throwable) {
      } finally {
        done()
      }
    }
  }

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun parse(json: String): List<Entry> {
    val array = JSONArray(json)
    return (0 until array.length()).map { i ->
      val o = array.getJSONObject(i)
      Entry(
        id = o.getString("id"),
        title = o.getString("title"),
        step = o.optString("step", ""),
        image = o.optString("image", "").ifEmpty { null },
        link = o.getString("link"),
        endsAt = if (o.has("endsAt") && !o.isNull("endsAt")) o.getLong("endsAt") else null,
        still = o.optString("still", "").ifEmpty { null },
        ringing = o.optBoolean("ringing", false),
      )
    }
  }

  private fun render(context: Context, json: String, sound: String) {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val now = System.currentTimeMillis()
    // Un minuteur dont l'heure de fin est passée sonne, même si l'app n'a pas encore pu le dire.
    val entries = parse(json).map { if (it.endsAt != null && it.endsAt <= now) it.copy(endsAt = null, ringing = true) else it }
    ensureChannels(context, manager, sound)

    val prefs = prefs(context)
    val shown = prefs.getStringSet("shown", emptySet())!!
    val nextShown = mutableSetOf<String>()
    val grouped = entries.size > 1
    val foreground = isForeground()

    for (entry in entries) {
      val ongoingId = notificationId(entry.id, false)
      val ringId = notificationId(entry.id, true)
      if (entry.ringing) {
        manager.cancel(ongoingId)
        // App ouverte : la sheet du minuteur sonne déjà, la notification reste silencieuse.
        val channel = if (foreground) QUIET_CHANNEL else ringChannel(sound)
        manager.notify(ringId, build(context, entry, channel, grouped))
        nextShown.add("ring:${entry.id}")
      } else {
        manager.cancel(ringId)
        manager.notify(ongoingId, build(context, entry, QUIET_CHANNEL, grouped))
        nextShown.add("ongoing:${entry.id}")
      }
      scheduleEnd(context, entry)
    }

    // Recettes terminées ou arrêtées : leurs notifications et alarmes disparaissent.
    val kept = entries.map { it.id }.toSet()
    for (key in shown) {
      val id = key.substringAfter(':')
      if (id in kept) continue
      manager.cancel(notificationId(id, false))
      manager.cancel(notificationId(id, true))
      cancelEnd(context, id)
    }

    if (grouped) manager.notify(SUMMARY_ID, summary(context, entries.size)) else manager.cancel(SUMMARY_ID)
    prefs.edit().putStringSet("shown", nextShown).apply()
  }

  private fun build(context: Context, entry: Entry, channel: String, grouped: Boolean): Notification {
    val views = RemoteViews(context.packageName, R.layout.cooking_notification_entry)
    views.setTextViewText(R.id.cooking_title, entry.title)
    views.setTextViewText(R.id.cooking_step, entry.step)
    val photo = entry.image?.let { photo(context, it) }
    if (photo != null) views.setImageViewBitmap(R.id.cooking_photo, photo)
    else views.setImageViewResource(R.id.cooking_photo, context.applicationInfo.icon)

    views.setViewVisibility(R.id.cooking_chrono, View.GONE)
    views.setViewVisibility(R.id.cooking_still, View.GONE)
    views.setViewVisibility(R.id.cooking_blink, View.GONE)
    views.setViewVisibility(R.id.cooking_time, View.VISIBLE)
    when {
      entry.ringing -> views.setViewVisibility(R.id.cooking_blink, View.VISIBLE)
      entry.endsAt != null -> {
        val left = entry.endsAt - System.currentTimeMillis()
        val base = SystemClock.elapsedRealtime() + left
        // Android écrit « 3:17 » ou « 1:03:17 » : on complète en « 00:03:17 » comme dans l'app. Le format change
        // à la dernière heure, une alarme refait la notification à ce moment-là (voir scheduleEnd).
        views.setChronometer(R.id.cooking_chrono, base, if (left >= HOUR) "0%s" else "00:%s", true)
        views.setChronometerCountDown(R.id.cooking_chrono, true)
        views.setViewVisibility(R.id.cooking_chrono, View.VISIBLE)
      }
      entry.still != null -> {
        views.setTextViewText(R.id.cooking_still, entry.still)
        views.setViewVisibility(R.id.cooking_still, View.VISIBLE)
      }
      else -> views.setViewVisibility(R.id.cooking_time, View.GONE)
    }

    val builder = Notification.Builder(context, channel)
      .setSmallIcon(R.drawable.toque_notification_icon)
      .setSubText(if (entry.ringing) "Minuteur terminé" else "Recette en cours")
      .setContentTitle(entry.title)
      .setContentText(entry.step)
      .setCustomContentView(views)
      .setStyle(Notification.DecoratedCustomViewStyle())
      .setContentIntent(open(context, entry))
      .setShowWhen(false)
      .setOngoing(!entry.ringing)
      .setOnlyAlertOnce(true)
      .setCategory(if (entry.ringing) Notification.CATEGORY_ALARM else Notification.CATEGORY_PROGRESS)
    if (grouped) builder.setGroup(GROUP)
    return builder.build()
  }

  /** En-tête du groupe : « Toqué • Recette en cours », avec le nombre de recettes ; il se déplie sur chacune. */
  private fun summary(context: Context, count: Int): Notification =
    Notification.Builder(context, QUIET_CHANNEL)
      .setSmallIcon(R.drawable.toque_notification_icon)
      .setSubText("Recette en cours")
      .setContentTitle("$count recettes en cours")
      .setGroup(GROUP)
      .setGroupSummary(true)
      .setGroupAlertBehavior(Notification.GROUP_ALERT_CHILDREN)
      .setOngoing(true)
      .setShowWhen(false)
      .setNumber(count)
      .setContentIntent(launch(context))
      .build()

  private fun open(context: Context, entry: Entry): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(entry.link)).setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(
      context, notificationId(entry.id, false), intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun launch(context: Context): PendingIntent? {
    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(context, SUMMARY_ID, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun ringChannel(sound: String) = "cooking_ring_$sound"

  private fun ensureChannels(context: Context, manager: NotificationManager, sound: String) {
    if (manager.getNotificationChannel(QUIET_CHANNEL) == null) {
      manager.createNotificationChannel(
        NotificationChannel(QUIET_CHANNEL, "Recette en cours", NotificationManager.IMPORTANCE_LOW).apply {
          setShowBadge(false)
        },
      )
    }
    val ring = ringChannel(sound)
    if (manager.getNotificationChannel(ring) == null) {
      // Une sonnerie par canal : Android règle le son d'une notification au niveau de son canal.
      val raw = context.resources.getIdentifier(sound, "raw", context.packageName)
      manager.createNotificationChannel(
        NotificationChannel(ring, "Fin des minuteurs", NotificationManager.IMPORTANCE_HIGH).apply {
          enableVibration(true)
          if (raw != 0) {
            setSound(
              Uri.parse("android.resource://${context.packageName}/$raw"),
              AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT).build(),
            )
          }
        },
      )
    }
  }

  // Alarme à l'heure de fin : la notification passe en sonnerie même si l'app est fermée.
  private fun scheduleEnd(context: Context, entry: Entry) {
    if (entry.endsAt == null) return cancelEnd(context, entry.id)
    val alarms = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = endIntent(context, entry.id)
    // Plus d'une heure : on se réveille d'abord à la dernière heure, pour changer le format du compte à rebours.
    val at = if (entry.endsAt - System.currentTimeMillis() >= HOUR) entry.endsAt - HOUR + 500 else entry.endsAt
    val exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()
    if (exact) alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent)
    else alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent)
  }

  private fun cancelEnd(context: Context, id: String) {
    (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(endIntent(context, id))
  }

  private fun endIntent(context: Context, id: String): PendingIntent {
    val intent = Intent(context, TimerEndReceiver::class.java).setAction("$ACTION_TIMER_END:$id")
    return PendingIntent.getBroadcast(
      context, notificationId(id, true), intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun notificationId(id: String, ringing: Boolean) = (id.hashCode() and 0x3FFFFFFF) * 2 + if (ringing) 1 else 0

  private fun isForeground(): Boolean {
    val info = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(info)
    return info.importance <= ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
  }

  /** Photo de la recette, carrée aux coins arrondis, gardée en cache pour les prochaines mises à jour. */
  private fun photo(context: Context, source: String): Bitmap? {
    val density = context.resources.displayMetrics.density
    val size = (40 * density).toInt()
    val file = File(File(context.cacheDir, "cooking-notification").apply { mkdirs() }, "${source.hashCode()}-$size.png")
    if (file.exists()) BitmapFactory.decodeFile(file.path)?.let { return it }
    val raw = runCatching { load(context, source) }.getOrNull() ?: return null
    val rounded = roundedSquare(raw, size, 8 * density)
    runCatching { file.outputStream().use { rounded.compress(Bitmap.CompressFormat.PNG, 100, it) } }
    return rounded
  }

  private fun load(context: Context, source: String): Bitmap? {
    val uri = Uri.parse(source)
    return when (uri.scheme) {
      "http", "https" -> {
        val connection = URL(source).openConnection() as HttpURLConnection
        connection.connectTimeout = 5000
        connection.readTimeout = 5000
        try {
          connection.inputStream.use { BitmapFactory.decodeStream(it) }
        } finally {
          connection.disconnect()
        }
      }
      "file", "content" -> context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) }
      // Image fournie avec l'app : en version compilée, un nom de ressource (« assets_images_recipes_pasta »).
      else -> {
        val res = context.resources.getIdentifier(source, "drawable", context.packageName)
        if (res == 0) null else BitmapFactory.decodeResource(context.resources, res)
      }
    }
  }

  private fun roundedSquare(source: Bitmap, size: Int, radius: Float): Bitmap {
    val side = minOf(source.width, source.height)
    val crop = Rect((source.width - side) / 2, (source.height - side) / 2, (source.width + side) / 2, (source.height + side) / 2)
    val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    val bounds = RectF(0f, 0f, size.toFloat(), size.toFloat())
    canvas.drawRoundRect(bounds, radius, radius, paint)
    paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
    canvas.drawBitmap(source, crop, bounds, paint)
    return output
  }
}
