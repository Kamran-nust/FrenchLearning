package com.frenchnclc7.app.data

import kotlin.math.floor
import kotlin.math.min
import kotlin.random.Random
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

/** French shown first (and spoken) or English shown first. */
enum class Direction { FE, EF }

/** One flashcard in today's queue. */
data class AnkiItem(
    val cardId: String,
    val french: String,
    val english: String,
    val dir: Direction,
    /** The curriculum day this word was first taught. */
    val sourceDay: Int,
    /** Unique within the session. */
    val key: String,
)

/** Today's queue: the day's new words first, then review words from earlier days. */
data class AnkiSession(val dayNumber: Int, val items: List<AnkiItem>, val reviewCount: Int)

/** Per-word counters, saved exactly as the web app saves them (`card-stats`). */
@Serializable
data class CardStat(
    val times_seen: Int = 0,
    val times_marked_hard_total: Int = 0,
    val last_seen_day: Int? = null,
)

/**
 * The Anki rules, matching the web app (see DESIGN_DOC sections 4 and 5):
 *  - new words: French to English, one card each;
 *  - review words: earlier days' words, one card each in a random direction, picked at random with
 *    words marked "hard" five times as likely; how many grows from about 5 up to about 40 as more days are done.
 */
object AnkiLogic {
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = true; encodeDefaults = true }
    private val statsSerializer = MapSerializer(String.serializer(), CardStat.serializer())
    private val hardSerializer = ListSerializer(String.serializer())

    /** How many review cards to add, given how many days are already completed. */
    fun reviewTarget(completedCount: Int): Int = floor(5 + (35.0 / 300.0) * completedCount + 0.5).toInt()

    private class Weighted(val item: Pair<AnkiCard, Int>, val weight: Int)

    /** Picks [count] distinct cards at random; a hard card counts five times. */
    fun weightedSample(pool: List<Pair<AnkiCard, Int>>, hard: Set<String>, count: Int, random: Random): List<Pair<AnkiCard, Int>> {
        val arr = pool.map { Weighted(it, if (it.first.i in hard) 5 else 1) }.toMutableList()
        val out = mutableListOf<Pair<AnkiCard, Int>>()
        var n = 0
        while (n < count && arr.isNotEmpty()) {
            val total = arr.sumOf { it.weight }
            var r = random.nextDouble() * total
            var idx = 0
            while (idx < arr.size) {
                r -= arr[idx].weight
                if (r <= 0) break
                idx++
            }
            idx = min(idx, arr.size - 1)
            out.add(arr[idx].item)
            arr.removeAt(idx)
            n++
        }
        return out
    }

    /** Builds the queue for [currentDay]; null if that day doesn't exist. */
    fun buildSession(
        days: List<DayContent>,
        currentDay: Int,
        completedCount: Int,
        hard: Set<String>,
        random: Random = Random.Default,
    ): AnkiSession? {
        val today = days.firstOrNull { it.day == currentDay } ?: return null
        val newItems = today.cards.map {
            AnkiItem(it.i, it.f, it.e, Direction.FE, today.day, it.i + "-new-" + today.day)
        }
        val pool = days.filter { it.day < today.day }.flatMap { d -> d.cards.map { it to d.day } }
        val reviewCount = min(reviewTarget(completedCount), pool.size)
        val reviewItems = weightedSample(pool, hard, reviewCount, random).map { (card, sourceDay) ->
            AnkiItem(
                card.i, card.f, card.e,
                if (random.nextDouble() < 0.5) Direction.EF else Direction.FE,
                sourceDay, card.i + "-rev-" + sourceDay + "-" + today.day,
            )
        }
        return AnkiSession(today.day, newItems + reviewItems, reviewCount)
    }

    /** After a real (not practice) day: every card in the queue has been seen once more. */
    fun markSeen(stats: Map<String, CardStat>, session: AnkiSession): Map<String, CardStat> {
        val out = stats.toMutableMap()
        for (w in session.items) {
            val s = out[w.cardId] ?: CardStat()
            out[w.cardId] = s.copy(times_seen = s.times_seen + 1, last_seen_day = session.dayNumber)
        }
        return out
    }

    fun markHard(stats: Map<String, CardStat>, cardId: String): Map<String, CardStat> {
        val s = stats[cardId] ?: CardStat()
        return stats + (cardId to s.copy(times_marked_hard_total = s.times_marked_hard_total + 1))
    }

    fun encodeStats(stats: Map<String, CardStat>): String = json.encodeToString(statsSerializer, stats)

    /** Null if the saved text can't be read (which is different from nothing being saved). */
    fun decodeStats(text: String): Map<String, CardStat>? =
        try { json.decodeFromString(statsSerializer, text) } catch (e: Exception) { null }

    fun encodeHard(hard: Collection<String>): String = json.encodeToString(hardSerializer, hard.toList())

    fun decodeHard(text: String): LinkedHashSet<String>? =
        try { LinkedHashSet(json.decodeFromString(hardSerializer, text)) } catch (e: Exception) { null }
}
