package com.frenchnclc7.app

import com.frenchnclc7.app.data.AnkiCard
import com.frenchnclc7.app.data.AnkiLimits
import com.frenchnclc7.app.data.AnkiLogic
import com.frenchnclc7.app.data.DayContent
import com.frenchnclc7.app.data.PlanParser
import com.frenchnclc7.app.data.ReviewSplit
import com.frenchnclc7.app.data.Tier
import com.frenchnclc7.app.data.WordBankLogic
import com.frenchnclc7.app.data.WordBankWord
import java.io.File
import kotlin.random.Random
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WordBankAndLimitsTest {
    private val days: List<DayContent> by lazy {
        PlanParser.anki(File("src/main/assets/plan/anki.json").readText(Charsets.UTF_8))
    }

    private fun word(id: String, french: String, english: String, starter: Int? = null, hidden: Boolean = false, note: String? = null, created: String = "2026-01-0$id") =
        WordBankWord(id, french, english, note, starter, hidden, 3, created)

    private val bank = (0 until 200).map { AnkiCard("wb:$it", "f$it", "e$it") to 1 }

    // ---------------------------------------------------------------- daily limits

    @Test
    fun limitsAreThirtyFreeTwoHundredPremiumAndNoneForSuper() {
        assertEquals(30, AnkiLimits.dailyLimit(Tier.FREE))
        assertEquals(200, AnkiLimits.dailyLimit(Tier.PREMIUM))
        assertNull(AnkiLimits.dailyLimit(Tier.SUPER))
    }

    @Test
    fun countsOnlyTodaysSavedTotal() {
        assertEquals(12, AnkiLimits.todaysCount("""{"date":"Sat Sep 19 2026","seen":12}""", "Sat Sep 19 2026"))
        assertEquals(0, AnkiLimits.todaysCount("""{"date":"Fri Sep 18 2026","seen":12}""", "Sat Sep 19 2026"))
        assertEquals(0, AnkiLimits.todaysCount(null, "x"))
        assertEquals(0, AnkiLimits.todaysCount("not json", "x"))
        assertEquals("""{"date":"Sat Sep 19 2026","seen":3}""", AnkiLimits.encodeCount("Sat Sep 19 2026", 3))
    }

    @Test
    fun worksOutWhatIsLeftAndWhenTheLimitIsReached() {
        assertEquals(18, AnkiLimits.remainingToday(Tier.FREE, 12))
        assertEquals(0, AnkiLimits.remainingToday(Tier.FREE, 45))
        assertNull(AnkiLimits.remainingToday(Tier.SUPER, 9999))
        assertFalse(AnkiLimits.limitReached(Tier.FREE, 29))
        assertTrue(AnkiLimits.limitReached(Tier.FREE, 30))
        assertFalse(AnkiLimits.limitReached(Tier.PREMIUM, 199))
        assertFalse(AnkiLimits.limitReached(Tier.SUPER, 100000))
    }

    @Test
    fun aDaysOwnSessionIsHeldToTheLimitButPracticeGetsWhatIsLeft() {
        assertEquals(30, AnkiLimits.sessionCap(Tier.FREE, practice = false, seen = 12))
        assertEquals(18, AnkiLimits.sessionCap(Tier.FREE, practice = true, seen = 12))
        assertEquals(10, AnkiLimits.sessionCap(Tier.PREMIUM, practice = true, seen = 190))
        assertNull(AnkiLimits.sessionCap(Tier.SUPER, practice = true, seen = 5000))
    }

    @Test
    fun superDayStepsSteadilyFromTwentyFiveToFifty() {
        assertEquals(25, AnkiLimits.superDayTotal(0))
        assertEquals(38, AnkiLimits.superDayTotal(150))
        assertEquals(50, AnkiLimits.superDayTotal(300))
        assertEquals(50, AnkiLimits.superDayTotal(301))
        var last = 0
        for (d in 0..300) {
            val t = AnkiLimits.superDayTotal(d)
            assertTrue(t >= last)
            last = t
        }
    }

    // ---------------------------------------------------------------- session size by tier

    private fun size(done: Int, tier: Tier?, custom: List<Pair<AnkiCard, Int>> = emptyList(), practice: Boolean = false, seen: Int = 0) =
        AnkiLogic.buildSession(days, done + 1, done, emptySet(), Random(3), custom, tier, practice, seen)!!

    @Test
    fun withoutATierSessionsAreSizedAsBefore() {
        assertEquals(days[150].cards.size + AnkiLogic.reviewTarget(150), size(150, null).items.size)
    }

    @Test
    fun aFreeDayIsHeldToThirtyLateInThePlan() {
        val s = size(300, Tier.FREE)
        assertEquals(30, s.items.size)
        assertEquals(days[300].cards.size, s.items.count { it.key.contains("-new-") })
        assertEquals(days[50].cards.size + AnkiLogic.reviewTarget(50), size(50, Tier.FREE).items.size)
    }

    @Test
    fun practiceGetsOnlyWhatIsLeftOfTodaysAllowance() {
        assertEquals(8, size(300, Tier.FREE, practice = true, seen = 22).items.size)
        assertEquals(0, size(300, Tier.FREE, practice = true, seen = 30).items.size)
    }

    @Test
    fun premiumGetsTheFullDay() {
        assertEquals(days[300].cards.size + 40, size(300, Tier.PREMIUM).items.size)
    }

    @Test
    fun aSuperDayIsAtLeastTwentyFiveFromDayOneRisingToFifty() {
        assertEquals(25, size(0, Tier.SUPER, bank).items.size)
        assertEquals(38, size(150, Tier.SUPER, bank).items.size)
        assertEquals(50, size(300, Tier.SUPER, bank).items.size)
        assertEquals(50, size(300, Tier.SUPER, bank, practice = true, seen = 9999).items.size)
    }

    @Test
    fun wordBankWordsAreReviewCardsNeverNew() {
        val s = size(29, Tier.PREMIUM, bank)
        val mine = s.items.filter { it.custom }
        assertTrue(mine.isNotEmpty())
        assertTrue(mine.size <= (s.reviewCount + 3) / 4)
        assertTrue(mine.all { it.key.contains("-rev-") && it.cardId.startsWith("wb:") })
        assertEquals(days[29].cards.size, s.items.count { it.key.contains("-new-") })
    }

    @Test
    fun dayOneReviewsAreFilledFromTheWordBank() {
        val s = AnkiLogic.buildSession(days, 1, 0, emptySet(), Random(1), bank, Tier.PREMIUM)!!
        assertEquals(5, s.reviewCount)
        assertEquals(5, s.items.count { it.custom })
    }

    // ---------------------------------------------------------------- Word Bank rules

    @Test
    fun premiumMayAddFiveHundredOwnWordsAndStarterWordsDontCount() {
        assertEquals(0, WordBankLogic.ownLimit(Tier.FREE))
        assertEquals(500, WordBankLogic.ownLimit(Tier.PREMIUM))
        assertTrue(WordBankLogic.ownLimit(Tier.SUPER) > 10000)
        val words = listOf(word("1", "bonjour", "hello", starter = 1), word("2", "le pain", "bread"))
        assertEquals(1, WordBankLogic.ownCount(words))
        val full = (0 until 500).map { word("x$it", "mot$it", "word$it") }
        assertFalse(WordBankLogic.hasRoom(Tier.PREMIUM, full))
        assertTrue(WordBankLogic.hasRoom(Tier.SUPER, full))
        assertFalse(WordBankLogic.hasRoom(Tier.FREE, emptyList()))
    }

    @Test
    fun tidiesAndValidatesWhatIsTyped() {
        val c = WordBankLogic.clean("  le   pain ", " bread ", "  ")
        assertEquals("le pain", c.french)
        assertEquals("bread", c.english)
        assertNull(c.note)
        assertEquals("Enter the French word.", WordBankLogic.validate("", "x", ""))
        assertEquals("Enter the English meaning.", WordBankLogic.validate("x", "  ", ""))
        assertNotNull(WordBankLogic.validate("x".repeat(201), "y", ""))
        assertNull(WordBankLogic.validate("le pain", "bread", ""))
    }

    @Test
    fun spotsDuplicatesIgnoringCaseAndHiddenWords() {
        val words = listOf(word("1", "Le Pain", "Bread"), word("2", "l'eau", "water", hidden = true))
        assertTrue(WordBankLogic.isDuplicate(words, "le pain", "bread"))
        assertFalse(WordBankLogic.isDuplicate(words, "le pain", "bread", ignoreId = "1"))
        assertFalse(WordBankLogic.isDuplicate(words, "l'eau", "water"))
    }

    @Test
    fun searchesAllThreeFieldsAndListsOwnWordsFirst() {
        val words = listOf(
            word("1", "bonjour", "hello", starter = 1),
            word("2", "le pain", "bread", note = "boulangerie"),
            word("3", "l'eau", "water", created = "2026-02-01"),
        )
        assertEquals(listOf("2"), WordBankLogic.filter(words, "boulang").map { it.id })
        assertEquals(listOf("1"), WordBankLogic.filter(words, "HELLO").map { it.id })
        assertEquals(listOf("3", "2", "1"), WordBankLogic.sortForDisplay(words).map { it.id })
    }

    @Test
    fun turnsWordsIntoAnkiCardsWithSafeIdsAndLeavesHiddenOnesOut() {
        val cards = WordBankLogic.toCards(listOf(word("a1", "le pain", "bread"), word("a2", "l'eau", "water", hidden = true)))
        assertEquals(1, cards.size)
        assertEquals(AnkiCard("wb:a1", "le pain", "bread"), cards[0].first)
        assertEquals(3, cards[0].second)
    }

    @Test
    fun splitsReviewSlotsLikeTheWebApp() {
        assertEquals(ReviewSplit(15, 5), WordBankLogic.splitReviewSlots(20, 500, 300))
        assertEquals(ReviewSplit(3, 2), WordBankLogic.splitReviewSlots(5, 100, 100))
        assertEquals(ReviewSplit(0, 5), WordBankLogic.splitReviewSlots(5, 0, 148))
        assertEquals(ReviewSplit(3, 2), WordBankLogic.splitReviewSlots(5, 3, 148))
        assertEquals(ReviewSplit(0, 2), WordBankLogic.splitReviewSlots(5, 0, 2))
        assertEquals(ReviewSplit(5, 0), WordBankLogic.splitReviewSlots(5, 100, 0))
        assertEquals(ReviewSplit(2, 0), WordBankLogic.splitReviewSlots(5, 2, 0))
    }

    @Test
    fun readsWhatTheDatabaseReturns() {
        val body = """[{"id":"7d81","user_id":"u","french":"le fromage","english":"cheese","note":null,"starter_id":null,"hidden":false,"added_day":7,"created_at":"2026-09-20T01:00:00+00:00"},
            |{"id":"9","user_id":"u","french":"bonjour","english":"Hello","note":null,"starter_id":12,"hidden":true,"added_day":1,"created_at":"x"}]""".trimMargin()
        val list = WordBankLogic.parseList(body)!!
        assertEquals(2, list.size)
        assertEquals(7, list[0].added_day)
        assertNull(list[0].starter_id)
        assertEquals(12, list[1].starter_id)
        assertTrue(list[1].hidden)
        assertNull(WordBankLogic.parseList("nope"))
    }
}
