package com.frenchnclc7.app

import com.frenchnclc7.app.data.ExtraLink
import com.frenchnclc7.app.data.LessonLinkLogic
import com.frenchnclc7.app.data.LessonLinks
import com.frenchnclc7.app.data.PlanSection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LessonLinksTest {
    private val chipRows = """[
        {"chip":"Conjugate être in the present tense in French (Le Présent)","url":"https://french.kwiziq.com/revision/grammar/conjugate-etre-in-le-present-present-tense"},
        {"chip":"noun gender","url":"https://french.kwiziq.com/revision/grammar/how-to-identify-gender-by-some-word-endings"}
    ]"""
    private val extraRows = """[
        {"day":1,"label":"Me/te/nous/vous","url":"https://french.kwiziq.com/revision/grammar/when-to-use-me-te-nous-and-vous-as-me-you-us-and-you-direct-and-indirect-object-pronouns","sort":1},
        {"day":1,"label":"Second extra","url":"https://french.kwiziq.com/x","sort":0},
        {"day":5,"label":"Day five","url":"https://french.kwiziq.com/y","sort":3}
    ]"""

    @Test
    fun chipLinksAndExtraLinksAreRead() {
        val links = LessonLinkLogic.parse(chipRows, extraRows)
        assertEquals(2, links.links.size)
        assertEquals(
            "https://french.kwiziq.com/revision/grammar/how-to-identify-gender-by-some-word-endings",
            links.links["noun gender"],
        )
        // extras are grouped by day and ordered by their sort number
        assertEquals(listOf("Second extra", "Me/te/nous/vous"), links.extras[1]!!.map { it.label })
        assertEquals(listOf(ExtraLink("Day five", "https://french.kwiziq.com/y")), links.extras[5])
        assertTrue(LessonLinkLogic.extrasFor(2, links).isEmpty())
    }

    @Test
    fun aDirectLinkReplacesTheGoogleSearchForThatChipOnly() {
        val links = LessonLinkLogic.parse(chipRows, null)
        assertTrue(LessonLinkLogic.hasDirect("noun gender", links))
        assertEquals(
            "https://french.kwiziq.com/revision/grammar/how-to-identify-gender-by-some-word-endings",
            LessonLinkLogic.href(PlanSection.KWIZIQ, "noun gender", links),
        )
        // a chip with no link keeps the Google search
        assertFalse(LessonLinkLogic.hasDirect("Mixed kwiz", links))
        assertEquals(
            "https://www.google.com/search?q=site%3Afrench.kwiziq.com%20Mixed%20kwiz",
            LessonLinkLogic.href(PlanSection.KWIZIQ, "Mixed kwiz", links),
        )
    }

    @Test
    fun freeAccountsHaveNoLinksSoEveryChipIsAGoogleSearch() {
        assertEquals(LessonLinks.EMPTY, LessonLinkLogic.parse("[]", "[]"))
        assertTrue(LessonLinkLogic.href(PlanSection.KWIZIQ, "noun gender", LessonLinks.EMPTY).startsWith("https://www.google.com/search"))
        assertTrue(LessonLinkLogic.href(PlanSection.TV5, "les salutations", LessonLinks.EMPTY).contains("site%3Atv5monde.com"))
    }

    @Test
    fun onlyHttpsAddressesAreEverOpened() {
        val rows = """[
            {"chip":"a","url":"http://insecure.example/a"},
            {"chip":"b","url":"javascript:alert(1)"},
            {"chip":"c","url":"file:///etc/passwd"},
            {"chip":"d","url":"https://ok.example/d"}
        ]"""
        val links = LessonLinkLogic.parse(rows, """[{"day":1,"label":"bad","url":"http://x.example","sort":0}]""")
        assertEquals(setOf("d"), links.links.keys)
        assertTrue(links.extras.isEmpty())
        assertFalse(LessonLinkLogic.isSafe("http://x"))
        assertTrue(LessonLinkLogic.isSafe("https://x"))
    }

    @Test
    fun brokenOrMissingRepliesNeverBreakTheOtherPart() {
        val onlyChips = LessonLinkLogic.parse(chipRows, null)
        assertEquals(2, onlyChips.links.size)
        assertTrue(onlyChips.extras.isEmpty())
        val onlyExtras = LessonLinkLogic.parse("not json", extraRows)
        assertTrue(onlyExtras.links.isEmpty())
        assertEquals(2, onlyExtras.extras[1]!!.size)
        // rows with missing fields are skipped, the rest are kept
        val partial = LessonLinkLogic.parse("""[{"chip":"x"},{"url":"https://a.example"},{"chip":"ok","url":"https://ok.example"}]""", """{"message":"nope"}""")
        assertEquals(mapOf("ok" to "https://ok.example"), partial.links)
        assertTrue(partial.extras.isEmpty())
        assertNull(LessonLinkLogic.moduleFor(PlanSection.GRAMMAR))
    }

    @Test
    fun onlyKwiziqAndTv5UseLessonLinks() {
        assertEquals("kwiziq", LessonLinkLogic.moduleFor(PlanSection.KWIZIQ))
        assertEquals("tv5", LessonLinkLogic.moduleFor(PlanSection.TV5))
        assertNull(LessonLinkLogic.moduleFor(PlanSection.WRITING))
        assertNull(LessonLinkLogic.moduleFor(PlanSection.ANKI))
    }
}
