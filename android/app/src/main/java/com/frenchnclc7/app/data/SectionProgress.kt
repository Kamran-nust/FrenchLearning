package com.frenchnclc7.app.data

import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/**
 * One section's saved progress. The field names and shapes are exactly what the web app saves
 * (so a day completed on the phone shows up on the web and the other way round).
 */
@Serializable
data class SectionProgress(
    val current_day: Int = 1,
    val completed_days: List<Int> = emptyList(),
    val last_activity_date: String? = null,
    val streak_count: Int = 0,
    val longest_streak: Int = 0,
)

data class Completion(val progress: SectionProgress, val streak: Int)

object ProgressLogic {
    // encodeDefaults: always write every field, as the web app does; nulls are written as null.
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true; explicitNulls = true }

    private val dateFormat = DateTimeFormatter.ofPattern("EEE MMM dd yyyy", Locale.US)

    /** A date the way the web app stores it (JavaScript's toDateString), e.g. "Tue Mar 10 2026". */
    fun dateKey(date: LocalDate): String = date.format(dateFormat)

    /**
     * Marks [dayNumber] complete and moves on to the next day. The streak counts real-world days, not
     * curriculum days: the first completion of a calendar day adds one if you were active yesterday,
     * otherwise starts again at 1; more completions on the same day leave it alone.
     */
    fun completeDay(progress: SectionProgress, dayNumber: Int, today: LocalDate = LocalDate.now()): Completion {
        val todayKey = dateKey(today)
        var streak = progress.streak_count
        var longest = progress.longest_streak
        if (progress.last_activity_date != todayKey) {
            val yesterdayKey = dateKey(today.minusDays(1))
            streak = if (progress.last_activity_date == yesterdayKey) streak + 1 else 1
            longest = maxOf(longest, streak)
        }
        return Completion(
            SectionProgress(
                current_day = progress.current_day + 1,
                completed_days = progress.completed_days + dayNumber,
                last_activity_date = todayKey,
                streak_count = streak,
                longest_streak = longest,
            ),
            streak,
        )
    }

    fun encode(progress: SectionProgress): String = json.encodeToString(SectionProgress.serializer(), progress)

    /** Null if the saved text can't be read (which is different from nothing being saved). */
    fun decode(text: String): SectionProgress? =
        try { json.decodeFromString(SectionProgress.serializer(), text) } catch (e: Exception) { null }
}
