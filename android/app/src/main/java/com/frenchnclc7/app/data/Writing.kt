package com.frenchnclc7.app.data

import java.time.Instant
import java.time.OffsetDateTime
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/** What is saved for one day of writing: the text, and the AI feedback once it has been asked for. */
@Serializable
data class WritingEntry(val text: String? = null, val feedback: String? = null)

/**
 * Writing rules that match the web app: word target, word count, the saved-entries format
 * (a JSON object keyed by day number, the same as the web app so entries are shared).
 */
object WritingLogic {
    /**
     * The most characters a single day's draft can hold. Matches MAX_INPUT_CHARS in the writing-feedback
     * function (so you can't type more than you can submit) and keeps writing-entries a bounded size.
     */
    const val MAX_DRAFT_CHARS = 4000

    // Omit missing fields (JavaScript leaves out undefined ones) and ignore anything unknown.
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }
    private val entriesSerializer = MapSerializer(String.serializer(), WritingEntry.serializer())
    private val targetPattern = Regex("(\\d+)[\\s-]*words?\\b", RegexOption.IGNORE_CASE)

    /** "Write a 60-word paragraph" gives 60; null if the task doesn't name a length. */
    fun extractWordTarget(task: String): Int? = targetPattern.find(task)?.groupValues?.get(1)?.toIntOrNull()

    fun countWords(text: String): Int {
        val trimmed = text.trim()
        return if (trimmed.isEmpty()) 0 else trimmed.split(Regex("\\s+")).size
    }

    /** "1h 5m" / "12m" (never less than a minute), for the "next feedback available in" line. */
    fun formatWait(ms: Long): String {
        val totalMinutes = maxOf(1L, (ms + 59_999) / 60_000)
        val h = totalMinutes / 60
        val m = totalMinutes % 60
        return if (h > 0) "${h}h ${m}m" else "${m}m"
    }

    fun encodeEntries(entries: Map<Int, WritingEntry>): String =
        json.encodeToString(entriesSerializer, entries.mapKeys { it.key.toString() })

    /** Null if the saved text can't be read (which is different from nothing being saved). */
    fun decodeEntries(text: String): Map<Int, WritingEntry>? = try {
        json.decodeFromString(entriesSerializer, text).mapNotNull { (k, v) -> k.toIntOrNull()?.let { it to v } }.toMap()
    } catch (e: Exception) {
        null
    }
}

/** The person's AI feedback allowance. `limit` and `remaining` are null when unlimited. */
data class FeedbackQuota(val limit: Int?, val used: Int, val remaining: Int?, val resetsAt: String?) {
    /** True when the allowance is used up and the next slot hasn't freed up yet. */
    fun limitReached(now: Instant = Instant.now()): Boolean {
        val resets = resetsAt?.let { parseInstant(it) } ?: return false
        return limit != null && remaining == 0 && resets.isAfter(now)
    }

    fun millisUntilReset(now: Instant = Instant.now()): Long =
        (resetsAt?.let { parseInstant(it) }?.toEpochMilli() ?: now.toEpochMilli()) - now.toEpochMilli()

    private fun parseInstant(text: String): Instant? = try { OffsetDateTime.parse(text).toInstant() } catch (e: Exception) { null }
}

/** How a request for AI feedback ended. */
sealed interface FeedbackOutcome {
    data class Success(val text: String, val quota: FeedbackQuota?) : FeedbackOutcome
    /** Today's allowance is used up. */
    data class LimitReached(val quota: FeedbackQuota?) : FeedbackOutcome
    /** The AI service is rate-limiting; nothing was used up. */
    data object Busy : FeedbackOutcome
    data object Failed : FeedbackOutcome
}

object FeedbackParser {
    fun quota(element: JsonElement?): FeedbackQuota? {
        val obj = element as? JsonObject ?: return null
        fun intOrNull(key: String): Int? = (obj[key] as? JsonPrimitive)?.takeIf { it !is JsonNull }?.contentOrNull?.toIntOrNull()
        return FeedbackQuota(
            limit = intOrNull("limit"),
            used = intOrNull("used") ?: 0,
            remaining = intOrNull("remaining"),
            resetsAt = (obj["resets_at"] as? JsonPrimitive)?.takeIf { it !is JsonNull }?.contentOrNull,
        )
    }

    /** Turns the writing-feedback function's reply into one of the outcomes above. */
    fun outcome(status: Int, body: String): FeedbackOutcome {
        val obj = try { Json.parseToJsonElement(body).jsonObject } catch (e: Exception) { JsonObject(emptyMap()) }
        return when {
            status == 429 && obj["code"]?.jsonPrimitive?.contentOrNull == "limit_reached" ->
                FeedbackOutcome.LimitReached(quota(obj["status"]))
            status == 502 -> FeedbackOutcome.Busy
            status in 200..299 -> {
                val text = obj["feedback"]?.jsonPrimitive?.contentOrNull
                if (text.isNullOrBlank()) FeedbackOutcome.Failed else FeedbackOutcome.Success(text, quota(obj["quota"]))
            }
            else -> FeedbackOutcome.Failed
        }
    }
}
