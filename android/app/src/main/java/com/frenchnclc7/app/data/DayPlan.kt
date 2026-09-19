package com.frenchnclc7.app.data

import java.time.Instant
import java.time.OffsetDateTime
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/** One section of the day-plan PDF: a title, and either flashcards, a paragraph, or a list. */
data class PlanPdfSection(
    val title: String,
    /** Small text on the right of the heading, e.g. "12 new cards". */
    val note: String? = null,
    val cards: List<AnkiCard> = emptyList(),
    val text: String? = null,
    val items: List<String> = emptyList(),
)

/** Everything that goes in the PDF for one day (kept apart from drawing, so it can be tested). */
data class DayPlanContent(val day: Int, val week: Int, val sections: List<PlanPdfSection>)

/** The download allowance: whether another PDF may be downloaded now, and when the next slot frees up. */
data class PdfQuota(val allowed: Boolean, val resetsAt: String?) {
    fun resetInstant(): Instant? = resetsAt?.let { try { OffsetDateTime.parse(it).toInstant() } catch (e: Exception) { null } }

    fun millisUntilReset(now: Instant = Instant.now()): Long = (resetInstant()?.toEpochMilli() ?: now.toEpochMilli()) - now.toEpochMilli()
}

/** The reply to asking for a download: [ok] is true when a download was reserved ([id] is the reservation). */
data class PdfClaim(val ok: Boolean, val id: Long?, val status: PdfQuota?)

object DayPlanLogic {
    private fun splitRaw(text: String) = text.split(";").map { it.trim() }.filter { it.isNotEmpty() }

    /**
     * The day's plan across the five sections, as plain text (no links), matching the web app's PDF:
     * Anki cards, the grammar task, Kwiziq lessons, TV5MONDE (its level, then the lessons), and the writing task.
     */
    fun build(anki: DayContent, grammar: DayContent, kwiziq: DayContent, tv5: DayContent, writing: DayContent): DayPlanContent =
        DayPlanContent(
            day = anki.day,
            week = anki.week,
            sections = listOf(
                PlanPdfSection("Anki", note = anki.cards.size.toString() + " new cards", cards = anki.cards),
                PlanPdfSection("Grammar book", text = grammar.text),
                PlanPdfSection("Kwiziq", items = splitRaw(kwiziq.text)),
                PlanPdfSection("TV5MONDE", items = listOfNotNull(tv5.badge) + splitRaw(tv5.text)),
                PlanPdfSection("Writing", text = writing.text),
            ),
        )

    fun fileName(day: Int): String = "French-NCLC7-Day-$day.pdf"

    /** "Available again in 5h 12m" */
    fun waitText(quota: PdfQuota, now: Instant = Instant.now()): String =
        "Available again in " + WritingLogic.formatWait(quota.millisUntilReset(now))

    private fun quotaFrom(el: JsonElement?): PdfQuota? {
        val obj = el as? JsonObject ?: return null
        val allowed = (obj["allowed"] as? JsonPrimitive)?.contentOrNull?.toBooleanStrictOrNull() ?: return null
        val resets = obj["resets_at"]?.let { if (it is JsonPrimitive && it.isString) it.content else null }
        return PdfQuota(allowed, resets)
    }

    /** Reads the reply to "where do I stand" (null if it can't be read). */
    fun parseQuota(body: String): PdfQuota? = try { quotaFrom(Json.parseToJsonElement(body)) } catch (e: Exception) { null }

    /** Reads the reply to "reserve a download". An unreadable reply counts as not allowed (never as allowed). */
    fun parseClaim(body: String): PdfClaim = try {
        val obj = Json.parseToJsonElement(body).jsonObject
        val ok = obj["ok"]?.jsonPrimitive?.contentOrNull?.toBooleanStrictOrNull() == true
        PdfClaim(ok, obj["id"]?.jsonPrimitive?.contentOrNull?.toLongOrNull(), quotaFrom(obj["status"]))
    } catch (e: Exception) {
        PdfClaim(false, null, null)
    }
}
