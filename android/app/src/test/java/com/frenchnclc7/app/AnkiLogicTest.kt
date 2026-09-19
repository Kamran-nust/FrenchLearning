package com.frenchnclc7.app

import com.frenchnclc7.app.data.AnkiLogic
import com.frenchnclc7.app.data.CardStat
import com.frenchnclc7.app.data.DayContent
import com.frenchnclc7.app.data.Direction
import com.frenchnclc7.app.data.PlanParser
import java.io.File
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AnkiLogicTest {
    private val realDays: List<DayContent> by lazy {
        PlanParser.anki(File("src/main/assets/plan/anki.json").readText(Charsets.UTF_8))
    }

    @Test
    fun reviewTargetGrowsFromFiveToFortyLikeTheWebApp() {
        assertEquals(5, AnkiLogic.reviewTarget(0))
        assertEquals(5, AnkiLogic.reviewTarget(1))
        assertEquals(10, AnkiLogic.reviewTarget(42))
        assertEquals(23, AnkiLogic.reviewTarget(150)) // 22.5 rounds up, as JavaScript's Math.round does
        assertEquals(40, AnkiLogic.reviewTarget(300))
    }

    @Test
    fun dayOneHasNewWordsOnlyAndAllOfThemAreFrenchToEnglish() {
        val s = AnkiLogic.buildSession(realDays, 1, 0, emptySet(), Random(1))!!
        assertEquals(realDays[0].cards.size, s.items.size)
        assertEquals(0, s.reviewCount)
        assertTrue(s.items.all { it.dir == Direction.FE && it.sourceDay == 1 })
        assertEquals("d1c1-new-1", s.items[0].key)
        assertEquals("bonjour", s.items[0].french)
        assertEquals("hello", s.items[0].english)
    }

    @Test
    fun laterDaysAddReviewCardsFromEarlierDaysOnly() {
        val s = AnkiLogic.buildSession(realDays, 20, 19, emptySet(), Random(7))!!
        val today = realDays[19].cards.size
        assertEquals(AnkiLogic.reviewTarget(19), s.reviewCount)
        assertEquals(today + s.reviewCount, s.items.size)
        val (news, reviews) = s.items.partition { it.sourceDay == 20 }
        assertEquals(today, news.size)
        // new words come first, then the review words
        assertEquals(s.items.take(today), news)
        assertTrue(reviews.all { it.sourceDay < 20 })
        assertTrue(news.all { it.dir == Direction.FE })
        // no card is reviewed twice
        assertEquals(reviews.size, reviews.map { it.cardId }.toSet().size)
    }

    @Test
    fun theSameSeedGivesTheSameSessionAndDifferentSeedsDiffer() {
        val a = AnkiLogic.buildSession(realDays, 60, 59, emptySet(), Random(3))
        val b = AnkiLogic.buildSession(realDays, 60, 59, emptySet(), Random(3))
        val c = AnkiLogic.buildSession(realDays, 60, 59, emptySet(), Random(4))
        assertEquals(a, b)
        assertTrue(a != c)
    }

    @Test
    fun reviewCardsGetBothDirections() {
        val s = AnkiLogic.buildSession(realDays, 120, 119, emptySet(), Random(11))!!
        val review = s.items.filter { it.sourceDay != 120 }
        assertTrue(review.any { it.dir == Direction.EF })
        assertTrue(review.any { it.dir == Direction.FE })
    }

    @Test
    fun hardWordsComeUpMoreOften() {
        val pool = realDays.filter { it.day < 40 }
        val allIds = pool.flatMap { it.cards }.map { it.i }
        val hard = allIds.take(6).toSet()
        var hardPicked = 0
        var easyPicked = 0
        val random = Random(99)
        repeat(1500) {
            val s = AnkiLogic.buildSession(realDays, 40, 39, hard, random)!!
            s.items.filter { it.sourceDay != 40 }.forEach { if (it.cardId in hard) hardPicked++ else easyPicked++ }
        }
        val hardRate = hardPicked.toDouble() / (1500 * hard.size)
        val easyRate = easyPicked.toDouble() / (1500 * (allIds.size - hard.size))
        // marked-hard cards weigh 5x, so they should be picked several times as often
        assertTrue("hard $hardRate vs easy $easyRate", hardRate > easyRate * 3)
    }

    @Test
    fun aDayThatDoesNotExistGivesNoSession() {
        assertNull(AnkiLogic.buildSession(realDays, 0, 0, emptySet()))
        assertNull(AnkiLogic.buildSession(realDays, 302, 0, emptySet()))
    }

    @Test
    fun everyRealDayBuildsAValidSession() {
        for (day in 1..301) {
            val s = AnkiLogic.buildSession(realDays, day, day - 1, emptySet(), Random(day))
            assertNotNull("day $day", s)
            val pool = realDays.filter { it.day < day }.sumOf { it.cards.size }
            val expectedReview = minOf(AnkiLogic.reviewTarget(day - 1), pool)
            assertEquals("day $day", realDays[day - 1].cards.size + expectedReview, s!!.items.size)
            assertEquals("day $day keys unique", s.items.size, s.items.map { it.key }.toSet().size)
        }
    }

    @Test
    fun finishingADayCountsEveryCardAsSeen() {
        val s = AnkiLogic.buildSession(realDays, 3, 2, emptySet(), Random(5))!!
        val before = mapOf(s.items[0].cardId to CardStat(times_seen = 2, times_marked_hard_total = 1, last_seen_day = 2))
        val after = AnkiLogic.markSeen(before, s)
        assertEquals(3, after[s.items[0].cardId]!!.times_seen)
        assertEquals(1, after[s.items[0].cardId]!!.times_marked_hard_total)
        assertEquals(3, after[s.items[0].cardId]!!.last_seen_day)
        assertTrue(s.items.all { after[it.cardId]!!.last_seen_day == 3 })
        // the input isn't modified
        assertEquals(2, before[s.items[0].cardId]!!.times_seen)
    }

    @Test
    fun markingHardCountsEachTime() {
        var stats = emptyMap<String, CardStat>()
        stats = AnkiLogic.markHard(stats, "d1c1")
        stats = AnkiLogic.markHard(stats, "d1c1")
        assertEquals(2, stats["d1c1"]!!.times_marked_hard_total)
        assertEquals(0, stats["d1c1"]!!.times_seen)
        assertNull(stats["d1c1"]!!.last_seen_day)
    }

    @Test
    fun savedFormatsMatchTheWebApp() {
        // hard-words is a JSON array of card ids; card-stats is an object keyed by card id
        val hard = AnkiLogic.decodeHard("""["d1c1","d2c3"]""")!!
        assertEquals(listOf("d1c1", "d2c3"), hard.toList())
        assertEquals("""["d1c1","d2c3"]""", AnkiLogic.encodeHard(hard))
        assertEquals("[]", AnkiLogic.encodeHard(emptyList()))

        val web = """{"d1c1":{"times_seen":2,"times_marked_hard_total":1,"last_seen_day":3},"d1c2":{"times_seen":0,"times_marked_hard_total":1,"last_seen_day":null}}"""
        val stats = AnkiLogic.decodeStats(web)!!
        assertEquals(CardStat(2, 1, 3), stats["d1c1"])
        assertNull(stats["d1c2"]!!.last_seen_day)
        val back = AnkiLogic.encodeStats(stats)
        assertTrue(back.contains("\"times_seen\":2"))
        assertTrue(back.contains("\"last_seen_day\":null"))
        assertEquals(stats, AnkiLogic.decodeStats(back))
        assertEquals("{}", AnkiLogic.encodeStats(emptyMap()))
    }

    @Test
    fun unreadableSavedDataIsNotTreatedAsEmpty() {
        assertNull(AnkiLogic.decodeHard("not json"))
        assertNull(AnkiLogic.decodeHard("{}"))
        assertNull(AnkiLogic.decodeStats("not json"))
        assertNull(AnkiLogic.decodeStats("[1]"))
    }
}
