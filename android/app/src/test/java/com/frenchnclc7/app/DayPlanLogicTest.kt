package com.frenchnclc7.app

import com.frenchnclc7.app.data.DayContent
import com.frenchnclc7.app.data.DayPlanContent
import com.frenchnclc7.app.data.DayPlanLogic
import com.frenchnclc7.app.data.PdfClaim
import com.frenchnclc7.app.data.PdfQuota
import com.frenchnclc7.app.data.PlanParser
import com.frenchnclc7.app.data.PlanSection
import java.io.File
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DayPlanLogicTest {
    private fun load(section: PlanSection): List<DayContent> {
        val text = File("src/main/assets/plan/" + section.file + ".json").readText(Charsets.UTF_8)
        return if (section == PlanSection.ANKI) PlanParser.anki(text) else PlanParser.textDays(text)
    }

    private val anki by lazy { load(PlanSection.ANKI) }
    private val grammar by lazy { load(PlanSection.GRAMMAR) }
    private val kwiziq by lazy { load(PlanSection.KWIZIQ) }
    private val tv5 by lazy { load(PlanSection.TV5) }
    private val writing by lazy { load(PlanSection.WRITING) }

    private fun content(day: Int): DayPlanContent =
        DayPlanLogic.build(anki[day - 1], grammar[day - 1], kwiziq[day - 1], tv5[day - 1], writing[day - 1])

    @Test
    fun theDayPlanHasTheFiveSectionsInTheWebAppsOrder() {
        val c = content(1)
        assertEquals(1, c.day)
        assertEquals(1, c.week)
        assertEquals(listOf("Anki", "Grammar book", "Kwiziq", "TV5MONDE", "Writing"), c.sections.map { it.title })
    }

    @Test
    fun eachSectionCarriesThatDaysContent() {
        val c = content(1)
        val (a, g, k, t, w) = c.sections
        assertEquals(anki[0].cards, a.cards)
        assertEquals("${anki[0].cards.size} new cards", a.note)
        assertEquals(grammar[0].text, g.text)
        assertEquals(writing[0].text, w.text)
        assertEquals(kwiziq[0].text.split(";").map { it.trim() }.filter { it.isNotEmpty() }, k.items)
        // TV5: the level first (when the day has one), then the lessons, like the web app
        assertEquals("Première classe", t.items.first())
        assertEquals(1 + tv5[0].text.split(";").size, t.items.size)
    }

    @Test
    fun everyRealDayBuildsACompletePlan() {
        for (day in 1..301) {
            val c = content(day)
            assertEquals("day $day", day, c.day)
            assertEquals("day $day", (day + 6) / 7, c.week)
            assertTrue("day $day anki", c.sections[0].cards.isNotEmpty())
            assertTrue("day $day grammar", !c.sections[1].text.isNullOrBlank())
            assertTrue("day $day kwiziq", c.sections[2].items.isNotEmpty())
            assertTrue("day $day tv5", c.sections[3].items.isNotEmpty())
            assertTrue("day $day writing", !c.sections[4].text.isNullOrBlank())
        }
    }

    @Test
    fun theFileIsNamedByDay() {
        assertEquals("French-NCLC7-Day-1.pdf", DayPlanLogic.fileName(1))
        assertEquals("French-NCLC7-Day-109.pdf", DayPlanLogic.fileName(109))
    }

    @Test
    fun theWaitIsShownInHoursAndMinutes() {
        val now = Instant.parse("2026-09-19T12:00:00Z")
        assertEquals("Available again in 5h 12m", DayPlanLogic.waitText(PdfQuota(false, "2026-09-19T17:12:00+00:00"), now))
        assertEquals("Available again in 1h 0m", DayPlanLogic.waitText(PdfQuota(false, "2026-09-19T13:00:00.000000+00:00"), now))
        assertEquals("Available again in 1m", DayPlanLogic.waitText(PdfQuota(false, "2026-09-19T12:00:20+00:00"), now))
    }

    @Test
    fun theDownloadAllowanceIsReadFromTheDatabaseReply() {
        val used = DayPlanLogic.parseQuota("""{"tier" : "premium", "allowed" : false, "resets_at" : "2026-09-20T16:17:12.162258+00:00"}""")
        assertEquals(PdfQuota(false, "2026-09-20T16:17:12.162258+00:00"), used)
        assertEquals(PdfQuota(true, null), DayPlanLogic.parseQuota("""{"tier":"super","allowed":true,"resets_at":null}"""))
        assertEquals(PdfQuota(false, null), DayPlanLogic.parseQuota("""{"tier":"free","allowed":false,"resets_at":null}"""))
        assertNull(DayPlanLogic.parseQuota("not json"))
        assertNull(DayPlanLogic.parseQuota("""{"tier":"premium"}"""))
    }

    @Test
    fun aReservationIsOnlyOkWhenTheDatabaseSaysSo() {
        val ok = DayPlanLogic.parseClaim("""{"ok":true,"id":7,"status":{"tier":"premium","allowed":false,"resets_at":"2026-09-20T16:17:12+00:00"}}""")
        assertEquals(PdfClaim(true, 7L, PdfQuota(false, "2026-09-20T16:17:12+00:00")), ok)
        val refused = DayPlanLogic.parseClaim("""{"ok":false,"status":{"tier":"premium","allowed":false,"resets_at":"2026-09-20T16:17:12+00:00"}}""")
        assertFalse(refused.ok)
        assertNull(refused.id)
        // anything unreadable counts as refused, never as allowed
        assertFalse(DayPlanLogic.parseClaim("not json").ok)
        assertFalse(DayPlanLogic.parseClaim("""{"id":5}""").ok)
        assertFalse(DayPlanLogic.parseClaim("""{"ok":"yes","id":5}""").ok)
    }
}
