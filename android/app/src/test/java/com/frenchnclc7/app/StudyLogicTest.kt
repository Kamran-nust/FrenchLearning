package com.frenchnclc7.app

import com.frenchnclc7.app.data.DayContent
import com.frenchnclc7.app.data.LessonChips
import com.frenchnclc7.app.data.PlanSection
import com.frenchnclc7.app.data.ProgressLogic
import com.frenchnclc7.app.data.SectionProgress
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class StudyLogicTest {
    private val today = LocalDate.of(2026, 3, 10)
    private val todayKey = "Tue Mar 10 2026"
    private val yesterdayKey = "Mon Mar 09 2026"

    @Test
    fun datesAreWrittenTheWayTheWebAppWritesThem() {
        // JavaScript's Date.toDateString(): weekday, month, zero-padded day, year
        assertEquals("Tue Mar 10 2026", ProgressLogic.dateKey(LocalDate.of(2026, 3, 10)))
        assertEquals("Sat Sep 19 2026", ProgressLogic.dateKey(LocalDate.of(2026, 9, 19)))
        assertEquals("Thu Jan 01 2026", ProgressLogic.dateKey(LocalDate.of(2026, 1, 1)))
    }

    @Test
    fun firstCompletionStartsAStreakOfOneAndMovesToDayTwo() {
        val done = ProgressLogic.completeDay(SectionProgress(), 1, today)
        assertEquals(1, done.streak)
        assertEquals(
            SectionProgress(current_day = 2, completed_days = listOf(1), last_activity_date = todayKey, streak_count = 1, longest_streak = 1),
            done.progress,
        )
    }

    @Test
    fun streakGrowsWhenYesterdayWasActive() {
        val before = SectionProgress(4, listOf(1, 2, 3), yesterdayKey, 3, 3)
        val done = ProgressLogic.completeDay(before, 4, today)
        assertEquals(4, done.streak)
        assertEquals(4, done.progress.longest_streak)
        assertEquals(listOf(1, 2, 3, 4), done.progress.completed_days)
    }

    @Test
    fun secondCompletionOnTheSameDayLeavesTheStreakAlone() {
        val before = SectionProgress(3, listOf(1, 2), todayKey, 2, 2)
        val done = ProgressLogic.completeDay(before, 3, today)
        assertEquals(2, done.streak)
        assertEquals(4, done.progress.current_day)
    }

    @Test
    fun aGapRestartsTheStreakButKeepsTheLongest() {
        val before = SectionProgress(10, (1..9).toList(), "Thu Mar 05 2026", 9, 9)
        val done = ProgressLogic.completeDay(before, 10, today)
        assertEquals(1, done.streak)
        assertEquals(9, done.progress.longest_streak)
    }

    @Test
    fun completingDoesNotChangeTheProgressItWasGiven() {
        val before = SectionProgress()
        ProgressLogic.completeDay(before, 1, today)
        assertEquals(SectionProgress(), before)
    }

    @Test
    fun progressSavedByTheWebAppIsReadCorrectly() {
        // exactly the shape the web app stores (including a null last_activity_date)
        val web = """{"current_day":5,"completed_days":[1,2,3,4],"last_activity_date":"Mon Mar 09 2026","streak_count":4,"longest_streak":7}"""
        val p = ProgressLogic.decode(web)
        assertNotNull(p)
        assertEquals(5, p!!.current_day)
        assertEquals(listOf(1, 2, 3, 4), p.completed_days)
        assertEquals(yesterdayKey, p.last_activity_date)
        assertEquals(7, p.longest_streak)
        assertNull(ProgressLogic.decode("""{"current_day":1,"completed_days":[],"last_activity_date":null,"streak_count":0,"longest_streak":0}""")!!.last_activity_date)
    }

    @Test
    fun unreadableProgressIsNotTreatedAsEmpty() {
        assertNull(ProgressLogic.decode("not json"))
        assertNull(ProgressLogic.decode("""{"current_day":"five"}"""))
    }

    @Test
    fun savedProgressUsesTheSameFieldNamesAsTheWebApp() {
        val text = ProgressLogic.encode(SectionProgress(2, listOf(1), todayKey, 1, 1))
        for (field in listOf("current_day", "completed_days", "last_activity_date", "streak_count", "longest_streak")) {
            assertTrue(field, text.contains("\"$field\""))
        }
        // and it round-trips
        assertEquals(SectionProgress(2, listOf(1), todayKey, 1, 1), ProgressLogic.decode(text))
        // a fresh section writes last_activity_date as null, like the web app
        assertTrue(ProgressLogic.encode(SectionProgress()).contains("\"last_activity_date\":null"))
    }

    private fun day(text: String, badge: String? = null) = DayContent(1, 1, badge, text, emptyList())

    @Test
    fun kwiziqDaysSplitIntoChips() {
        val d = day("Conjugate être; subject pronouns ;; je, tu")
        assertEquals(listOf("Conjugate être", "subject pronouns", "je, tu"), LessonChips.chips(PlanSection.KWIZIQ, d))
        assertEquals(d.text, LessonChips.body(PlanSection.KWIZIQ, d))
    }

    @Test
    fun tv5DropsTheLevelPrefixAndJoinsTheBody() {
        val d = day("Première classe: Les salutations / Se présenter", "Première classe")
        assertEquals(listOf("Les salutations / Se présenter"), LessonChips.chips(PlanSection.TV5, d))
        assertEquals("Les salutations / Se présenter", LessonChips.body(PlanSection.TV5, d))
        val two = day("A2-B1 : un; deux")
        assertEquals("un · deux", LessonChips.body(PlanSection.TV5, two))
    }

    @Test
    fun grammarAndWritingHaveNoChips() {
        assertTrue(LessonChips.chips(PlanSection.GRAMMAR, day("Ch. 1")).isEmpty())
        assertTrue(LessonChips.chips(PlanSection.WRITING, day("Write 5 lines")).isEmpty())
    }

    @Test
    fun searchLinksMatchTheWebApp() {
        assertEquals(
            "https://www.google.com/search?q=site%3Afrench.kwiziq.com%20noun%20gender",
            LessonChips.searchUrl(PlanSection.KWIZIQ, "noun gender"),
        )
        assertTrue(LessonChips.searchUrl(PlanSection.TV5, "les salutations").contains("site%3Atv5monde.com%20les%20salutations"))
    }
}
