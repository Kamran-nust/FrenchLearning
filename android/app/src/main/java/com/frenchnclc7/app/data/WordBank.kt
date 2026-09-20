package com.frenchnclc7.app.data

import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

/** One row of the person's Word Bank (the `word_bank_words` table). */
@Serializable
data class WordBankWord(
    val id: String,
    val french: String,
    val english: String,
    val note: String? = null,
    /** Set for words that came from the starter list; null for words the person added. */
    val starter_id: Int? = null,
    val hidden: Boolean = false,
    val added_day: Int = 1,
    val created_at: String = "",
)

/** A Word Bank word ready to join the Anki review pool: the card plus the day it was added. */
typealias WordBankCard = Pair<AnkiCard, Int>

/** How the review slots of a session are shared between the plan's words and Word Bank words. */
data class ReviewSplit(val builtin: Int, val custom: Int)

/** The Word Bank rules, the same as the web app (`frontend/src/shared/wordBank.js`). */
object WordBankLogic {
    /** Premium may add up to this many of their own words; starter words never count. */
    const val PREMIUM_OWN_LIMIT = 500

    /** Super has no limit in practice; the ceiling only stops a runaway paste filling the database. */
    const val SUPER_OWN_CEILING = 20000

    const val MAX_FRENCH = 200
    const val MAX_ENGLISH = 200
    const val MAX_NOTE = 300

    private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }

    fun ownLimit(tier: Tier): Int = when (tier) {
        Tier.FREE -> 0
        Tier.PREMIUM -> PREMIUM_OWN_LIMIT
        Tier.SUPER -> SUPER_OWN_CEILING
    }

    fun isOwn(w: WordBankWord): Boolean = w.starter_id == null

    fun ownCount(words: List<WordBankWord>): Int = words.count { isOwn(it) }

    fun hasRoom(tier: Tier, words: List<WordBankWord>): Boolean = ownCount(words) < ownLimit(tier)

    data class Clean(val french: String, val english: String, val note: String?)

    /** Collapses stray spaces so "  le   pain " and "le pain" are the same word. */
    fun clean(french: String, english: String, note: String): Clean {
        fun tidy(s: String) = s.replace(Regex("\\s+"), " ").trim()
        return Clean(tidy(french), tidy(english), tidy(note).ifEmpty { null })
    }

    /** A message to show, or null if the word can be saved. */
    fun validate(french: String, english: String, note: String): String? {
        val w = clean(french, english, note)
        if (w.french.isEmpty()) return "Enter the French word."
        if (w.english.isEmpty()) return "Enter the English meaning."
        if (w.french.length > MAX_FRENCH || w.english.length > MAX_ENGLISH) return "That's too long. Keep each side under 200 characters."
        if ((w.note?.length ?: 0) > MAX_NOTE) return "The note is too long. Keep it under 300 characters."
        return null
    }

    fun isDuplicate(words: List<WordBankWord>, french: String, english: String, ignoreId: String? = null): Boolean {
        val w = clean(french, english, "")
        return words.any {
            !it.hidden && it.id != ignoreId &&
                it.french.equals(w.french, ignoreCase = true) && it.english.equals(w.english, ignoreCase = true)
        }
    }

    /** Searches both languages and the note. */
    fun filter(words: List<WordBankWord>, query: String): List<WordBankWord> {
        val q = query.trim().lowercase()
        if (q.isEmpty()) return words
        return words.filter {
            it.french.lowercase().contains(q) || it.english.lowercase().contains(q) || (it.note ?: "").lowercase().contains(q)
        }
    }

    /** The person's own words first (newest first), then the starter words in their saved order. */
    fun sortForDisplay(words: List<WordBankWord>): List<WordBankWord> =
        words.filter { isOwn(it) }.sortedByDescending { it.created_at } + words.filter { !isOwn(it) }

    /** Word Bank rows as Anki cards. Hidden words are left out; the "wb:" id can never clash with a plan card. */
    fun toCards(words: List<WordBankWord>): List<WordBankCard> =
        words.filter { !it.hidden }.map { AnkiCard("wb:" + it.id, it.french, it.english) to it.added_day }

    fun isWordBankCard(cardId: String): Boolean = cardId.startsWith("wb:")

    /**
     * Splits a session's review slots between plan words and Word Bank words. Word Bank gets about a quarter (at
     * least one) so a long list can't crowd out the plan, but fills the gap when there are too few plan words to
     * review yet (for example on day 1).
     */
    fun splitReviewSlots(target: Int, builtinCount: Int, customCount: Int): ReviewSplit {
        if (customCount <= 0 || target <= 0) return ReviewSplit(min(target, builtinCount).coerceAtLeast(0), 0)
        val quota = max(1, ceil(target / 4.0).toInt())
        val custom = min(customCount, max(quota, target - builtinCount))
        val builtin = max(0, min(builtinCount, target - custom))
        return ReviewSplit(builtin, custom)
    }

    /** The rows from `word_bank_list` / an insert, or null if the reply can't be read. */
    fun parseList(body: String): List<WordBankWord>? =
        try { json.decodeFromString(ListSerializer(WordBankWord.serializer()), body) } catch (e: Exception) { null }
}
