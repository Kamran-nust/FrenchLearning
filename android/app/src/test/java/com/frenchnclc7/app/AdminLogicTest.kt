package com.frenchnclc7.app

import com.frenchnclc7.app.data.AdminLogic
import com.frenchnclc7.app.data.AdminUser
import com.frenchnclc7.app.data.Tier
import java.time.Instant
import java.time.ZoneId
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AdminLogicTest {
    private val now = Instant.parse("2026-09-19T12:00:00Z")
    private val utc = ZoneId.of("UTC")

    private fun user(id: String, email: String?, username: String?, tier: Tier = Tier.FREE, fb: Int = 0) =
        AdminUser(id, email, username, tier, "2026-01-05T10:00:00+00:00", "2026-09-19T11:55:00+00:00", fb)

    private val people = listOf(
        user("1", "kamran90.fastian@gmail.com", "Kamran", Tier.SUPER),
        user("2", "kamran_nust@yahoo.com", "Kamran1", Tier.PREMIUM, fb = 2),
        user("3", "kami90@yorku.ca", "Kami"),
        user("4", "noname@example.com", null),
    )

    @Test
    fun theUserListReplyIsRead() {
        val body = """[
            {"user_id":"a1","email":"a@x.com","username":"alice","tier":"premium","created_at":"2026-01-05T10:00:00.123456+00:00","last_sign_in_at":null,"feedback_used_24h":3},
            {"user_id":"b2","email":"b@x.com","username":null,"tier":"free","created_at":"2026-02-01T10:00:00+00:00","last_sign_in_at":"2026-09-19T11:58:00+00:00","feedback_used_24h":0}
        ]"""
        val users = AdminLogic.parseUsers(body)!!
        assertEquals(2, users.size)
        assertEquals(AdminUser("a1", "a@x.com", "alice", Tier.PREMIUM, "2026-01-05T10:00:00.123456+00:00", null, 3), users[0])
        assertNull(users[1].username)
        assertEquals("b@x.com", users[1].displayName)
        assertEquals("alice", users[0].displayName)
    }

    @Test
    fun oddReplyShapesAreHandledSafely() {
        assertEquals(emptyList<AdminUser>(), AdminLogic.parseUsers("[]"))
        assertNull(AdminLogic.parseUsers("not json"))
        assertNull(AdminLogic.parseUsers("""{"message":"Only super users can list users."}"""))
        // a row with no id is skipped; an unknown or missing tier shows as free (never as more than free)
        val users = AdminLogic.parseUsers("""[{"email":"x@x.com"},{"user_id":"u1","tier":"gold"},{"user_id":"u2"}]""")!!
        assertEquals(listOf("u1", "u2"), users.map { it.userId })
        assertTrue(users.all { it.tier == Tier.FREE })
    }

    @Test
    fun searchMatchesEmailOrUsernameIgnoringCase() {
        assertEquals(listOf("1", "2"), AdminLogic.filter(people, "kamran").map { it.userId })
        assertEquals(listOf("2"), AdminLogic.filter(people, "  NUST ").map { it.userId })
        assertEquals(listOf("3"), AdminLogic.filter(people, "yorku").map { it.userId })
        assertEquals(listOf("4"), AdminLogic.filter(people, "noname").map { it.userId })
        assertEquals(people, AdminLogic.filter(people, "   "))
        assertTrue(AdminLogic.filter(people, "zzz").isEmpty())
    }

    @Test
    fun tiersAreCounted() {
        assertEquals(mapOf(Tier.FREE to 2, Tier.PREMIUM to 1, Tier.SUPER to 1), AdminLogic.counts(people))
        assertEquals(mapOf(Tier.FREE to 0, Tier.PREMIUM to 0, Tier.SUPER to 0), AdminLogic.counts(emptyList()))
    }

    @Test
    fun timeAgoReadsLikeTheWebApp() {
        fun ago(iso: String?) = AdminLogic.timeAgo(iso, now)
        assertEquals("never", ago(null))
        assertEquals("never", ago("garbage"))
        assertEquals("just now", ago("2026-09-19T11:59:40+00:00"))
        assertEquals("just now", ago("2026-09-19T11:59:00+00:00")) // 1 minute
        assertEquals("2m ago", ago("2026-09-19T11:58:00+00:00"))
        assertEquals("59m ago", ago("2026-09-19T11:01:00+00:00"))
        assertEquals("2h ago", ago("2026-09-19T10:30:00+00:00")) // 90 minutes rounds to 2 hours
        assertEquals("23h ago", ago("2026-09-18T13:00:00+00:00"))
        assertEquals("1d ago", ago("2026-09-18T11:00:00+00:00"))
        assertEquals("10d ago", ago("2026-09-09T12:00:00+00:00"))
        assertEquals("just now", ago("2026-09-19T12:05:00+00:00")) // a slightly-fast clock never shows a negative time
    }

    @Test
    fun datesAreShownInTheReadersLocalTime() {
        assertEquals("Sep 19, 2026", AdminLogic.formatDate("2026-09-19T15:00:00+00:00", utc, Locale.US))
        assertEquals("Sep 20, 2026", AdminLogic.formatDate("2026-09-19T23:30:00-05:00", utc, Locale.US))
        assertEquals("never", AdminLogic.formatDate(null, utc, Locale.US))
    }

    @Test
    fun theActivityLineMatchesTheWebApp() {
        val line = AdminLogic.activityLine(people[1], now, utc, Locale.US)
        assertEquals("Joined Jan 5, 2026 · Last sign-in 5m ago · 2 AI feedbacks (24h)", line)
        assertEquals("Joined Jan 5, 2026 · Last sign-in 5m ago", AdminLogic.activityLine(people[2], now, utc, Locale.US))
        assertTrue(AdminLogic.activityLine(user("9", "a@b.c", null, fb = 1), now, utc, Locale.US).endsWith("1 AI feedback (24h)"))
        assertTrue(AdminLogic.activityLine(user("9", "a@b.c", null).copy(lastSignInAt = null), now, utc, Locale.US).contains("Last sign-in never"))
    }

    @Test
    fun onlyMakingSomeoneSuperAsksFirst() {
        assertTrue(AdminLogic.needsConfirmation(Tier.SUPER))
        assertFalse(AdminLogic.needsConfirmation(Tier.PREMIUM))
        assertFalse(AdminLogic.needsConfirmation(Tier.FREE))
        assertEquals(
            "Make kami90@yorku.ca a super user? Super users can change everyone's tier.",
            AdminLogic.confirmText(people[2]),
        )
        assertEquals("Make this user a super user? Super users can change everyone's tier.", AdminLogic.confirmText(user("9", null, null)))
    }

    @Test
    fun yourOwnRowAndSavingRowsAreLocked() {
        assertTrue(AdminLogic.isLocked(people[0], "1", saving = false))
        assertFalse(AdminLogic.isLocked(people[1], "1", saving = false))
        assertTrue(AdminLogic.isLocked(people[1], "1", saving = true))
        assertFalse(AdminLogic.isLocked(people[1], null, saving = false))
    }
}
