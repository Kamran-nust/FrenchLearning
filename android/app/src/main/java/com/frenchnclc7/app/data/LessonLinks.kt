package com.frenchnclc7.app.data

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/** An extra lesson link shown on one day, in addition to the plan's own chips. */
data class ExtraLink(val label: String, val url: String)

/**
 * Direct lesson links for Kwiziq / TV5MONDE (premium and super only; the database only hands them to those tiers).
 *  - [links]: chip text to the real lesson page, replacing that chip's Google search;
 *  - [extras]: day number to extra links for that day.
 * Free accounts never ask for these and simply get [EMPTY], so every chip stays a Google search.
 */
data class LessonLinks(
    val links: Map<String, String> = emptyMap(),
    val extras: Map<Int, List<ExtraLink>> = emptyMap(),
) {
    companion object {
        val EMPTY = LessonLinks()
    }
}

object LessonLinkLogic {
    /** Only web (https) addresses are ever opened. */
    fun isSafe(url: String): Boolean = url.startsWith("https://")

    private fun rows(body: String?): JsonArray? =
        try { body?.let { Json.parseToJsonElement(it) as? JsonArray } } catch (e: Exception) { null }

    private fun text(el: JsonElement?): String? = try { el?.jsonPrimitive?.contentOrNull } catch (e: Exception) { null }

    /**
     * Reads the two replies (chip links, extra links). A reply that is missing or unreadable counts as
     * empty, so a problem with one never breaks the other (same as the web app).
     */
    fun parse(chipRows: String?, extraRows: String?): LessonLinks {
        val links = mutableMapOf<String, String>()
        rows(chipRows)?.forEach { row ->
            val obj = try { row.jsonObject } catch (e: Exception) { return@forEach }
            val chip = text(obj["chip"])
            val url = text(obj["url"])
            if (chip != null && url != null && isSafe(url)) links[chip] = url
        }
        // extras come in the order the database sorted them (by "sort"); keep that order per day
        val extras = mutableMapOf<Int, MutableList<ExtraLink>>()
        val extraList = mutableListOf<Triple<Int, Int, ExtraLink>>()
        rows(extraRows)?.forEach { row ->
            val obj = try { row.jsonObject } catch (e: Exception) { return@forEach }
            val day = try { obj["day"]?.jsonPrimitive?.int } catch (e: Exception) { null }
            val label = text(obj["label"])
            val url = text(obj["url"])
            val sort = try { obj["sort"]?.jsonPrimitive?.int } catch (e: Exception) { null } ?: 0
            if (day != null && label != null && url != null && isSafe(url)) extraList.add(Triple(day, sort, ExtraLink(label, url)))
        }
        for ((day, _, link) in extraList.sortedBy { it.second }) extras.getOrPut(day) { mutableListOf() }.add(link)
        return LessonLinks(links, extras)
    }

    /** True if this chip has a direct lesson page. */
    fun hasDirect(chip: String, links: LessonLinks): Boolean = links.links[chip]?.let { isSafe(it) } == true

    /** Where a chip goes: its real lesson page if there is one, otherwise a Google search (as for free accounts). */
    fun href(section: PlanSection, chip: String, links: LessonLinks): String =
        links.links[chip]?.takeIf { isSafe(it) } ?: LessonChips.searchUrl(section, chip)

    fun extrasFor(day: Int, links: LessonLinks): List<ExtraLink> = links.extras[day].orEmpty()

    /** The lesson_links module name for a section ("kwiziq" or "tv5"); null for sections without lesson links. */
    fun moduleFor(section: PlanSection): String? = when (section) {
        PlanSection.KWIZIQ -> "kwiziq"
        PlanSection.TV5 -> "tv5"
        else -> null
    }
}
