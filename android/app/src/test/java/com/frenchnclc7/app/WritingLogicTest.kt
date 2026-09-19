package com.frenchnclc7.app

import com.frenchnclc7.app.data.FeedbackOutcome
import com.frenchnclc7.app.data.FeedbackParser
import com.frenchnclc7.app.data.FeedbackQuota
import com.frenchnclc7.app.data.WritingEntry
import com.frenchnclc7.app.data.WritingLogic
import java.io.File
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WritingLogicTest {
    @Test
    fun wordTargetsAreReadFromTheTask() {
        assertEquals(60, WritingLogic.extractWordTarget("Write a 60-word paragraph about yourself."))
        assertEquals(80, WritingLogic.extractWordTarget("Write 80 words about your day"))
        assertEquals(120, WritingLogic.extractWordTarget("Aim for 120 Words."))
        assertNull(WritingLogic.extractWordTarget("Write 5-6 lines introducing yourself."))
    }

    @Test
    fun everyRealWritingTaskParsesWithoutSurprises() {
        // Same rule as the web app, run over the real plan: any day that names a length names a sensible one.
        val text = File("src/main/assets/plan/writing.json").readText(Charsets.UTF_8)
        val tasks = Regex("\"x\":\"((?:[^\"\\\\]|\\\\.)*)\"").findAll(text).map { it.groupValues[1] }.toList()
        assertEquals(301, tasks.size)
        val targets = tasks.mapNotNull { WritingLogic.extractWordTarget(it) }
        assertTrue(targets.isNotEmpty())
        assertTrue(targets.all { it in 10..1000 })
    }

    @Test
    fun wordsAreCountedByWhitespace() {
        assertEquals(0, WritingLogic.countWords(""))
        assertEquals(0, WritingLogic.countWords("   \n  "))
        assertEquals(3, WritingLogic.countWords("Bonjour, je m'appelle"))
        assertEquals(4, WritingLogic.countWords("  un  deux\ntrois\tquatre "))
    }

    @Test
    fun waitTimeIsShownInHoursAndMinutes() {
        assertEquals("1m", WritingLogic.formatWait(0))
        assertEquals("1m", WritingLogic.formatWait(30_000))
        assertEquals("12m", WritingLogic.formatWait(12 * 60_000L))
        assertEquals("13m", WritingLogic.formatWait(12 * 60_000L + 1))
        assertEquals("1h 0m", WritingLogic.formatWait(60 * 60_000L))
        assertEquals("5h 12m", WritingLogic.formatWait((5 * 60 + 12) * 60_000L))
    }

    @Test
    fun entriesUseTheWebAppsFormat() {
        val entries = mapOf(
            3 to WritingEntry(text = "Bonjour"),
            5 to WritingEntry(text = "Salut", feedback = "Très bien !"),
        )
        val text = WritingLogic.encodeEntries(entries)
        // keyed by day number, and a missing feedback is left out (like JavaScript's undefined)
        assertTrue(text.contains("\"3\":{\"text\":\"Bonjour\"}"))
        assertTrue(text.contains("\"feedback\":\"Très bien !\""))
        assertFalse(text.contains("null"))
        assertEquals(entries, WritingLogic.decodeEntries(text))
    }

    @Test
    fun entriesSavedByTheWebAppAreReadCorrectly() {
        val web = """{"1":{"text":"Je m'appelle Kamran.","feedback":"Bien!\nContinue."},"2":{"text":"Salut"}}"""
        val entries = WritingLogic.decodeEntries(web)
        assertNotNull(entries)
        assertEquals("Je m'appelle Kamran.", entries!![1]!!.text)
        assertEquals("Bien!\nContinue.", entries[1]!!.feedback)
        assertNull(entries[2]!!.feedback)
        assertEquals(emptyMap<Int, WritingEntry>(), WritingLogic.decodeEntries("{}"))
    }

    @Test
    fun unreadableEntriesAreNotTreatedAsEmpty() {
        assertNull(WritingLogic.decodeEntries("not json"))
        assertNull(WritingLogic.decodeEntries("[1,2]"))
    }

    @Test
    fun quotaLimitReachedFollowsTheWebAppsRule() {
        val now = Instant.parse("2026-09-19T12:00:00Z")
        val later = "2026-09-20T12:00:00.162258+00:00"
        val earlier = "2026-09-19T11:00:00+00:00"
        assertTrue(FeedbackQuota(1, 1, 0, later).limitReached(now))
        assertFalse(FeedbackQuota(1, 1, 0, earlier).limitReached(now))   // the wait is already over
        assertFalse(FeedbackQuota(5, 2, 3, null).limitReached(now))      // some left
        assertFalse(FeedbackQuota(null, 9, null, null).limitReached(now)) // unlimited (super)
        assertEquals(24 * 60 * 60 * 1000L + 162, FeedbackQuota(1, 1, 0, later).millisUntilReset(now))
    }

    @Test
    fun successfulFeedbackIsParsedWithTheUpdatedAllowance() {
        val body = """{"feedback":"Très bien.\nAttention aux accords.","quota":{"tier":"premium","limit":5,"used":2,"remaining":3,"resets_at":null}}"""
        val out = FeedbackParser.outcome(200, body) as FeedbackOutcome.Success
        assertEquals("Très bien.\nAttention aux accords.", out.text)
        assertEquals(FeedbackQuota(5, 2, 3, null), out.quota)
    }

    @Test
    fun superUsersHaveNoLimit() {
        val body = """{"feedback":"Bien.","quota":{"tier":"super","limit":null,"used":7,"remaining":null,"resets_at":null}}"""
        val out = FeedbackParser.outcome(200, body) as FeedbackOutcome.Success
        assertNull(out.quota!!.limit)
        assertNull(out.quota!!.remaining)
    }

    @Test
    fun theDailyLimitIsRecognised() {
        val body = """{"error":"Daily AI feedback limit reached.","code":"limit_reached","status":{"tier":"free","limit":1,"used":1,"remaining":0,"resets_at":"2026-09-20T16:17:12.162258+00:00"}}"""
        val out = FeedbackParser.outcome(429, body) as FeedbackOutcome.LimitReached
        assertEquals(FeedbackQuota(1, 1, 0, "2026-09-20T16:17:12.162258+00:00"), out.quota)
    }

    @Test
    fun otherFailuresAreTellApart() {
        assertEquals(FeedbackOutcome.Busy, FeedbackParser.outcome(502, """{"error":"Gemini request failed"}"""))
        assertEquals(FeedbackOutcome.Failed, FeedbackParser.outcome(500, """{"error":"Unexpected server error"}"""))
        assertEquals(FeedbackOutcome.Failed, FeedbackParser.outcome(200, """{"feedback":"  "}"""))
        assertEquals(FeedbackOutcome.Failed, FeedbackParser.outcome(200, "not json"))
        // a 429 that isn't our limit code is just a failure
        assertEquals(FeedbackOutcome.Failed, FeedbackParser.outcome(429, """{"error":"slow down"}"""))
    }
}
