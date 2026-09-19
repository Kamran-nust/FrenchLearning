package com.frenchnclc7.app

import com.frenchnclc7.app.data.PlanParser
import com.frenchnclc7.app.data.PlanSection
import com.frenchnclc7.app.data.Progress
import com.frenchnclc7.app.data.TOTAL_DAYS
import com.frenchnclc7.app.data.Tier
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PlanAndProgressTest {
    // Unit tests run from the app/ folder.
    private fun plan(name: String) = File("src/main/assets/plan/$name.json").readText(Charsets.UTF_8)

    @Test
    fun everySectionHas301DaysInOrder() {
        for (section in PlanSection.entries) {
            val text = plan(section.file)
            val days = if (section == PlanSection.ANKI) PlanParser.anki(text) else PlanParser.textDays(text)
            assertEquals(section.id, TOTAL_DAYS, days.size)
            days.forEachIndexed { i, d ->
                assertEquals(i + 1, d.day)
                assertEquals((d.day + 6) / 7, d.week)
            }
        }
    }

    @Test
    fun ankiDaysHaveCards() {
        val days = PlanParser.anki(plan("anki"))
        assertTrue(days.all { it.cards.isNotEmpty() && it.cards.all { c -> c.f.isNotBlank() && c.e.isNotBlank() } })
        assertEquals("bonjour", days[0].cards[0].f)
        assertEquals("hello", days[0].cards[0].e)
    }

    @Test
    fun tv5DaysCarryTheLevelBadge() {
        val days = PlanParser.textDays(plan("tv5"))
        assertEquals("Première classe", days[0].badge)
    }

    @Test
    fun completedDaysParsesTheSavedProgressJson() {
        val saved = """{"current_day":4,"completed_days":[1,2,3],"streak_count":3}"""
        assertEquals(setOf(1, 2, 3), Progress.completedDays(saved))
        assertEquals(emptySet<Int>(), Progress.completedDays(null))
        assertEquals(emptySet<Int>(), Progress.completedDays("not json"))
        assertEquals(emptySet<Int>(), Progress.completedDays("""{"current_day":1}"""))
    }

    @Test
    fun fullyCompletedThroughIsTheHighestDayEverySectionFinished() {
        val a = (1..10).toSet()
        val b = (1..7).toSet()
        val c = (1..9).toSet()
        assertEquals(7, Progress.fullyCompletedThrough(listOf(a, b, c)))
        // stops at the first gap
        assertEquals(2, Progress.fullyCompletedThrough(listOf(setOf(1, 2, 4, 5), setOf(1, 2, 4, 5))))
        // nothing saved in one section
        assertEquals(0, Progress.fullyCompletedThrough(listOf(a, emptySet())))
        // never above the total
        assertEquals(10, Progress.fullyCompletedThrough(listOf((1..20).toSet()), total = 10))
        assertEquals(0, Progress.fullyCompletedThrough(emptyList()))
    }

    @Test
    fun unknownTiersCountAsFree() {
        assertEquals(Tier.PREMIUM, Tier.from("premium"))
        assertEquals(Tier.SUPER, Tier.from("SUPER"))
        assertEquals(Tier.FREE, Tier.from(null))
        assertEquals(Tier.FREE, Tier.from("gold"))
        assertFalse(Tier.from("nonsense") == Tier.SUPER)
    }
}
