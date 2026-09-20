package com.frenchnclc7.app.data

import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** What is saved as `anki-daily`: how many cards were seen on which day (the same shape the web app saves). */
@Serializable
data class DailyCount(val date: String = "", val seen: Int = 0)

/**
 * Daily limits for the Anki vocabulary section and Super's bigger day - the same rules as the web app
 * (`frontend/src/shared/ankiLimits.js`).
 *
 * The counter lives on the device with the rest of the saved progress, so a determined person could reset it;
 * making it server-side is a later change (see DESIGN_DOC.md, "Later: server-side Anki limits").
 */
object AnkiLimits {
    const val FREE_DAILY = 30
    const val PREMIUM_DAILY = 200

    /** Super's day (new words plus reviews) rises steadily from [SUPER_DAY_MIN] to [SUPER_DAY_MAX] across the plan. */
    const val SUPER_DAY_MIN = 25
    const val SUPER_DAY_MAX = 50

    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    /** Words (cards) a person can see per day; null means no limit. */
    fun dailyLimit(tier: Tier): Int? = when (tier) {
        Tier.FREE -> FREE_DAILY
        Tier.PREMIUM -> PREMIUM_DAILY
        Tier.SUPER -> null
    }

    /** Cards in a Super user's day once [completedDays] are done (25 at 0, 50 at 300 or more). */
    fun superDayTotal(completedDays: Int): Int {
        val f = (completedDays / 300.0).coerceIn(0.0, 1.0)
        return floor(SUPER_DAY_MIN + (SUPER_DAY_MAX - SUPER_DAY_MIN) * f + 0.5).toInt()
    }

    /** Cards seen today, from the saved text. A count saved on another day (or unreadable) is 0. */
    fun todaysCount(saved: String?, today: String): Int {
        if (saved.isNullOrBlank()) return 0
        val c = try { json.decodeFromString(DailyCount.serializer(), saved) } catch (e: Exception) { return 0 }
        return if (c.date == today && c.seen > 0) c.seen else 0
    }

    fun encodeCount(date: String, seen: Int): String = json.encodeToString(DailyCount.serializer(), DailyCount(date, seen))

    /** Cards still allowed today, or null if there is no limit. */
    fun remainingToday(tier: Tier, seen: Int): Int? = dailyLimit(tier)?.let { max(0, it - seen) }

    fun limitReached(tier: Tier, seen: Int): Boolean = (remainingToday(tier, seen) ?: 1) <= 0

    /**
     * The most cards a new session may have. A day's own session is only held to the daily limit itself, so the
     * day can always be completed; extra practice gets only what is left of today's allowance. Null = no cap.
     */
    fun sessionCap(tier: Tier, practice: Boolean, seen: Int): Int? {
        val limit = dailyLimit(tier) ?: return null
        return if (practice) max(0, limit - seen) else limit
    }

    /** Used by the session builder; small helper so the two callers agree. */
    internal fun clampReviews(target: Int, cap: Int?, newCount: Int): Int =
        if (cap == null) target else min(target, max(0, cap - newCount))
}
