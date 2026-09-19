package com.frenchnclc7.app.data

import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.floor
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject

/** One row of the admin user list (the database only returns these to super users). */
data class AdminUser(
    val userId: String,
    val email: String?,
    val username: String?,
    val tier: Tier,
    val createdAt: String?,
    val lastSignInAt: String?,
    val feedbackUsed24h: Int,
) {
    /** What the list shows as the name: the username if there is one, otherwise the email. */
    val displayName: String get() = username ?: email ?: userId
}

/** The admin page's rules, matching the web app; kept apart from the screen so they can be tested. */
object AdminLogic {
    private fun str(el: JsonElement?): String? = (el as? JsonPrimitive)?.takeIf { it !is JsonNull }?.contentOrNull

    /** Reads the reply of the user-list function; null if it can't be read (an empty list is a valid reply). */
    fun parseUsers(body: String): List<AdminUser>? {
        val rows = try { Json.parseToJsonElement(body) as? JsonArray } catch (e: Exception) { null } ?: return null
        val out = mutableListOf<AdminUser>()
        for (row in rows) {
            val obj = row as? JsonObject ?: continue
            val id = str(obj["user_id"]) ?: continue
            out.add(
                AdminUser(
                    userId = id,
                    email = str(obj["email"]),
                    username = str(obj["username"])?.takeIf { it.isNotEmpty() },
                    tier = Tier.from(str(obj["tier"])),
                    createdAt = str(obj["created_at"]),
                    lastSignInAt = str(obj["last_sign_in_at"]),
                    feedbackUsed24h = str(obj["feedback_used_24h"])?.toIntOrNull() ?: 0,
                ),
            )
        }
        return out
    }

    /** People whose email or username contains the search text (ignoring case); everyone when it is blank. */
    fun filter(users: List<AdminUser>, query: String): List<AdminUser> {
        val q = query.trim().lowercase()
        if (q.isEmpty()) return users
        return users.filter { (it.email ?: "").lowercase().contains(q) || (it.username ?: "").lowercase().contains(q) }
    }

    fun counts(users: List<AdminUser>): Map<Tier, Int> = Tier.entries.associateWith { t -> users.count { it.tier == t } }

    private fun instant(iso: String?): Instant? = try { iso?.let { OffsetDateTime.parse(it).toInstant() } } catch (e: Exception) { null }

    /** "just now", "5m ago", "3h ago", "2d ago", or "never". */
    fun timeAgo(iso: String?, now: Instant = Instant.now()): String {
        val then = instant(iso) ?: return "never"
        val minutes = maxOf(0L, floor((now.toEpochMilli() - then.toEpochMilli()) / 60000.0 + 0.5).toLong())
        if (minutes < 2) return "just now"
        if (minutes < 60) return "${minutes}m ago"
        val hours = floor(minutes / 60.0 + 0.5).toLong()
        if (hours < 24) return "${hours}h ago"
        return "${floor(hours / 24.0 + 0.5).toLong()}d ago"
    }

    /** "Sep 19, 2026", or "never". */
    fun formatDate(iso: String?, zone: ZoneId = ZoneId.systemDefault(), locale: Locale = Locale.getDefault()): String {
        val t = instant(iso) ?: return "never"
        return DateTimeFormatter.ofPattern("MMM d, yyyy", locale).withZone(zone).format(t)
    }

    /** "Joined Sep 19, 2026 · Last sign-in 5m ago · 2 AI feedbacks (24h)" */
    fun activityLine(u: AdminUser, now: Instant = Instant.now(), zone: ZoneId = ZoneId.systemDefault(), locale: Locale = Locale.getDefault()): String {
        var line = "Joined ${formatDate(u.createdAt, zone, locale)} · Last sign-in ${timeAgo(u.lastSignInAt, now)}"
        if (u.feedbackUsed24h > 0) {
            line += " · ${u.feedbackUsed24h} AI feedback" + (if (u.feedbackUsed24h == 1) "" else "s") + " (24h)"
        }
        return line
    }

    /** Making someone super is the one change that asks first (super users can change everyone's tier). */
    fun needsConfirmation(newTier: Tier): Boolean = newTier == Tier.SUPER

    fun confirmText(u: AdminUser): String = "Make ${u.email ?: "this user"} a super user? Super users can change everyone's tier."

    /** Your own row is locked, so you can't demote yourself by accident. */
    fun isLocked(u: AdminUser, myId: String?, saving: Boolean): Boolean = u.userId == myId || saving
}
