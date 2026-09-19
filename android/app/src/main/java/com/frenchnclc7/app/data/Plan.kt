package com.frenchnclc7.app.data

import android.content.Context
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.builtins.ListSerializer

const val TOTAL_DAYS = 301

/** The five study sections. `storageKey` is where the web app saves that section's progress. */
enum class PlanSection(val id: String, val title: String, val tagline: String, val storageKey: String, val file: String) {
    ANKI("anki", "Anki vocabulary", "Daily flashcards, both directions", "progress", "anki"),
    GRAMMAR("grammar", "Grammar book", "Grammaire Progressive du Français", "grammar-progress", "grammar"),
    KWIZIQ("kwiziq", "Kwiziq", "Daily lesson links", "kwiziq-progress", "kwiziq"),
    TV5("tv5monde", "TV5MONDE", "Daily listening links", "tv5-progress", "tv5"),
    WRITING("writing", "Writing", "Daily writing task", "writing-progress", "writing"),
}

@Serializable
data class AnkiCard(val i: String, val f: String, val e: String)

@Serializable
data class AnkiDay(val d: Int, val w: Int, val c: List<AnkiCard>)

/** Grammar, Kwiziq, TV5 and Writing all share this shape (`l` is TV5's level badge). */
@Serializable
data class TextDay(val d: Int, val w: Int, val x: String, val l: String? = null, val e: List<GrammarEntryRaw> = emptyList())

/** One book reference on a Grammar day: which book, which chapters, and the chapter titles. */
@Serializable
data class GrammarEntryRaw(val b: String, val c: List<Int> = emptyList(), val t: String? = null)

/** The chapters to open in one grammar book for a day (a day can name several books). */
data class BookChapters(val book: String, val chapters: List<Int>) {
    /** "A1-A2 ch. 1, 4" */
    val label: String get() = "$book ch. " + chapters.joinToString(", ")
}

object GrammarBooks {
    /** Groups a day's entries by book, keeping the order books first appear and every chapter in order (same as the web app). */
    fun group(entries: List<GrammarEntryRaw>): List<BookChapters> {
        val order = LinkedHashMap<String, MutableList<Int>>()
        for (e in entries) order.getOrPut(e.b) { mutableListOf() }.addAll(e.c)
        return order.map { (book, chapters) -> BookChapters(book, chapters) }
    }
}

/** What one day of one section shows. `chapters` is only used by Grammar. */
data class DayContent(
    val day: Int,
    val week: Int,
    val badge: String?,
    val text: String,
    val cards: List<AnkiCard>,
    val chapters: List<BookChapters> = emptyList(),
)

private val json = Json { ignoreUnknownKeys = true }

/** Parses the exported plan files (see tools/export-plan-data.mjs). Pure, so it is unit-tested. */
object PlanParser {
    fun anki(text: String): List<DayContent> =
        json.decodeFromString(ListSerializer(AnkiDay.serializer()), text)
            .map { DayContent(it.d, it.w, null, it.c.size.toString() + " new cards", it.c) }

    fun textDays(text: String): List<DayContent> =
        json.decodeFromString(ListSerializer(TextDay.serializer()), text)
            .map { DayContent(it.d, it.w, it.l, it.x, emptyList(), GrammarBooks.group(it.e)) }
}

/** Loads the plan JSON bundled in the app's assets, once per section. */
class PlanRepository(private val context: Context) {
    private val cache = mutableMapOf<PlanSection, List<DayContent>>()

    fun days(section: PlanSection): List<DayContent> = cache.getOrPut(section) {
        val text = context.assets.open("plan/" + section.file + ".json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        if (section == PlanSection.ANKI) PlanParser.anki(text) else PlanParser.textDays(text)
    }
}
