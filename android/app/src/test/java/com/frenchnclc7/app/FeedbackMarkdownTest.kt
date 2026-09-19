package com.frenchnclc7.app

import com.frenchnclc7.app.data.FeedbackMarkdown
import com.frenchnclc7.app.data.FeedbackPiece
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class FeedbackMarkdownTest {
    private fun plain(text: String) = FeedbackMarkdown.pieces(text).joinToString("") { it.text }

    @Test
    fun boldAndItalicBecomeStyledRuns() {
        assertEquals(
            listOf(FeedbackPiece("Use "), FeedbackPiece("à", bold = true), FeedbackPiece(" and "), FeedbackPiece("je", italic = true), FeedbackPiece(".")),
            FeedbackMarkdown.pieces("Use **à** and *je*."),
        )
    }

    @Test
    fun bulletsBecomeDotsAndKeepTheirFormatting() {
        val pieces = FeedbackMarkdown.pieces("* **Accent:** fix it\n- plain point")
        assertEquals("• Accent: fix it\n• plain point", pieces.joinToString("") { it.text })
        assertEquals(FeedbackPiece("Accent:", bold = true), pieces[1])
    }

    @Test
    fun theRealFeedbackFromTheEmulatorWalkthroughIsCleaned() {
        val text = "Here is how to address the task's checkpoints:\n* **Accent on *à*:** You wrote *\"a Toronto\"* → correct to **\"à Toronto\"**.\n* **Missing nationality:** Remember to use *suis* after *je*."
        val out = plain(text)
        assertFalse(out.contains("*"))
        assertEquals(
            "Here is how to address the task's checkpoints:\n• Accent on à: You wrote \"a Toronto\" → correct to \"à Toronto\".\n• Missing nationality: Remember to use suis after je.",
            out,
        )
    }

    @Test
    fun unpairedAsterisksAreLeftAlone() {
        assertEquals("2 * 3 = 6", plain("2 * 3 = 6"))
        assertEquals("a ** b", plain("a ** b"))
        assertEquals("price*", plain("price*"))
    }

    @Test
    fun plainTextAndBlankLinesSurvive() {
        assertEquals("Très bien.\n\nContinue !", plain("Très bien.\n\nContinue !"))
        assertEquals("", plain(""))
        assertEquals(listOf(FeedbackPiece("Just text")), FeedbackMarkdown.pieces("Just text"))
    }
}
