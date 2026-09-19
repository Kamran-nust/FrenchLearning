package com.frenchnclc7.app

import com.frenchnclc7.app.data.BookChapters
import com.frenchnclc7.app.data.GrammarBooks
import com.frenchnclc7.app.data.GrammarEntryRaw
import com.frenchnclc7.app.data.PlanParser
import com.frenchnclc7.app.data.Tier
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GrammarPdfTest {
    private val days by lazy { PlanParser.textDays(File("src/main/assets/plan/grammar.json").readText(Charsets.UTF_8)) }

    @Test
    fun dayOneOpensChaptersOneAndFourOfTheFirstBook() {
        assertEquals(listOf(BookChapters("A1-A2", listOf(1, 4))), days[0].chapters)
        assertEquals("A1-A2 ch. 1, 4", days[0].chapters[0].label)
    }

    @Test
    fun entriesAreGroupedByBookInFirstSeenOrder() {
        val groups = GrammarBooks.group(
            listOf(
                GrammarEntryRaw("A1-A2", listOf(3), "x"),
                GrammarEntryRaw("A2-B1", listOf(10), "y"),
                GrammarEntryRaw("A1-A2", listOf(5, 6), "z"),
            ),
        )
        assertEquals(listOf(BookChapters("A1-A2", listOf(3, 5, 6)), BookChapters("A2-B1", listOf(10))), groups)
        assertEquals("A2-B1 ch. 10", groups[1].label)
        assertTrue(GrammarBooks.group(emptyList()).isEmpty())
    }

    @Test
    fun everyRealDayKeepsAllItsChaptersAndOnlyUsesTheThreeBooks() {
        val raw = File("src/main/assets/plan/grammar.json").readText(Charsets.UTF_8)
        var daysWithChapters = 0
        for (d in days) {
            if (d.chapters.isNotEmpty()) daysWithChapters++
            assertTrue("day ${d.day}", d.chapters.all { it.book in setOf("A1-A2", "A2-B1", "B1-B2") && it.chapters.isNotEmpty() })
            assertEquals("day ${d.day}: one group per book", d.chapters.size, d.chapters.map { it.book }.toSet().size)
        }
        // Grammar plan days that name no book (revision days) have no PDF button, like the web app.
        assertTrue(daysWithChapters > 100)
        assertTrue(raw.contains("\"b\":\"A1-A2\""))
    }

    @Test
    fun otherSectionsHaveNoChapters() {
        val kwiziq = PlanParser.textDays(File("src/main/assets/plan/kwiziq.json").readText(Charsets.UTF_8))
        assertTrue(kwiziq.all { it.chapters.isEmpty() })
    }

    @Test
    fun onlyPremiumAndSuperPassTheTierCheck() {
        assertFalse(Tier.FREE.atLeast(Tier.PREMIUM))
        assertTrue(Tier.PREMIUM.atLeast(Tier.PREMIUM))
        assertTrue(Tier.SUPER.atLeast(Tier.PREMIUM))
        assertFalse(Tier.PREMIUM.atLeast(Tier.SUPER))
        // an unknown tier counts as free, so it never unlocks the PDFs
        assertFalse(Tier.from("gold").atLeast(Tier.PREMIUM))
        assertFalse(Tier.from(null).atLeast(Tier.PREMIUM))
    }
}
