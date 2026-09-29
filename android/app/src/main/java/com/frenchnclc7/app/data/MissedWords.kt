package com.frenchnclc7.app.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.intOrNull

/** One word marked "I got it wrong": card id, French, English (the same shape the web app saves). */
@Serializable
data class MissedWord(val i: String, val f: String, val e: String)

/** What is saved as `anki-missed`: the day the words were missed on and the words, each once. */
@Serializable
data class MissedList(val day: Int? = null, val words: List<MissedWord> = emptyList())

/**
 * Anki "I got it wrong" marks - the same rules as the web app (`frontend/src/shared/missedWords.js`).
 *
 * While a round is running the marks live in memory. When the round finishes they are merged into the saved
 * list (each word once) and shown under the "Day N done" buttons. The list is saved to the account as
 * `anki-missed`, so it survives closing the app and is the same on every device, and it is cleared when the
 * person taps "Start next day" (or resets Anki).
 */
object MissedWords {
    const val KEY = "anki-missed"
    val EMPTY = MissedList()

    private val json = Json { ignoreUnknownKeys = true; explicitNulls = true; encodeDefaults = true }

    fun encode(list: MissedList): String = json.encodeToString(MissedList.serializer(), list)

    /** The saved value, checked and tidied; anything unreadable counts as an empty list. */
    fun decode(text: String?): MissedList {
        if (text.isNullOrBlank()) return EMPTY
        val parsed = try { json.parseToJsonElement(text) } catch (e: Exception) { return EMPTY }
        val root = parsed as? JsonObject ?: return EMPTY
        val arr = root["words"] as? JsonArray ?: return EMPTY
        val seen = HashSet<String>()
        val words = mutableListOf<MissedWord>()
        for (el in arr) {
            val o = el as? JsonObject ?: continue
            val i = o.string("i") ?: continue
            val f = o.string("f") ?: continue
            val e = o.string("e") ?: continue
            if (!seen.add(i)) continue
            words += MissedWord(i, f, e)
        }
        val day = (root["day"] as? JsonPrimitive)?.takeIf { !it.isString }?.intOrNull
        return MissedList(day, words)
    }

    private fun JsonObject.string(key: String): String? = (this[key] as? JsonPrimitive)?.takeIf { it.isString }?.content

    /** Marks or unmarks one card in the current round (keyed by card id, in the order they were marked). */
    fun toggle(round: Map<String, MissedWord>, item: AnkiItem): Map<String, MissedWord> =
        if (item.cardId in round) round - item.cardId
        else round + (item.cardId to MissedWord(item.cardId, item.french, item.english))

    /** The saved list plus this round's marks, each word once, in the order they were first marked. */
    fun merge(words: List<MissedWord>, round: Map<String, MissedWord>): List<MissedWord> {
        val have = words.mapTo(HashSet()) { it.i }
        return words + round.values.filter { have.add(it.i) }
    }

    /** The missed words that aren't flagged hard yet (what "Flag all as hard" would add). */
    fun unflagged(words: List<MissedWord>, hard: Set<String>): List<MissedWord> = words.filter { it.i !in hard }
}
