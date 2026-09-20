package com.frenchnclc7.app

import com.frenchnclc7.app.data.AccountLogic
import com.frenchnclc7.app.data.PlanCell
import com.frenchnclc7.app.data.PlansLogic
import com.frenchnclc7.app.data.Tier
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AccountLogicTest {
    @Test
    fun deletingNeedsTheWordDeleteAndAPassword() {
        assertTrue(AccountLogic.canConfirmDelete("DELETE", "secret"))
        assertTrue(AccountLogic.canConfirmDelete(" DELETE ", "secret"))
        assertFalse(AccountLogic.canConfirmDelete("delete", "secret"))
        assertFalse(AccountLogic.canConfirmDelete("DELETE", ""))
        assertFalse(AccountLogic.canConfirmDelete("", "secret"))
    }

    @Test
    fun superAccountsCantBeDeleted() {
        assertTrue(AccountLogic.canDelete(Tier.FREE))
        assertTrue(AccountLogic.canDelete(Tier.PREMIUM))
        assertFalse(AccountLogic.canDelete(Tier.SUPER))
    }

    @Test
    fun checksAnEmailBeforeAskingForAResetLink() {
        assertTrue(AccountLogic.isEmail("me@example.com"))
        assertTrue(AccountLogic.isEmail("  me@example.com "))
        assertFalse(AccountLogic.isEmail("nope"))
        assertFalse(AccountLogic.isEmail("a b@c.com"))
        assertFalse(AccountLogic.isEmail(""))
    }

    @Test
    fun theResetMessageSaysNothingAboutWhetherTheAccountExists() {
        val m = AccountLogic.resetSentMessage(" me@example.com ")
        assertTrue(m.startsWith("If an account exists for me@example.com"))
    }

    @Test
    fun thePlansTableListsTheWordBankForPremiumOnly() {
        val row = PlansLogic.groups.flatMap { it.rows }.first { it.label.startsWith("Word Bank") }
        assertEquals(PlanCell.NotIncluded, row.free)
        assertEquals(PlanCell.Text("Up to 500 of your own"), row.premium)
    }
}
