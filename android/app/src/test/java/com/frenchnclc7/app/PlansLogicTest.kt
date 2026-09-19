package com.frenchnclc7.app

import com.frenchnclc7.app.data.BillingPeriod
import com.frenchnclc7.app.data.NotConfiguredBilling
import com.frenchnclc7.app.data.PlanCell
import com.frenchnclc7.app.data.PlansLogic
import com.frenchnclc7.app.data.PurchaseResult
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PlansLogicTest {
    @Test
    fun yearlySavesTwentyFourDollarsWhichIsTwoMonthsFree() {
        assertEquals(12, BillingPeriod.MONTHLY.amount)
        assertEquals(120, BillingPeriod.YEARLY.amount)
        assertEquals(24, PlansLogic.yearlySaving)
        assertEquals(10, PlansLogic.yearlyPerMonth)
        assertEquals(2, PlansLogic.yearlyFreeMonths)
    }

    @Test
    fun notesMatchTheWebPage() {
        assertEquals("$10 a month. 2 months free, save $24", PlansLogic.note(BillingPeriod.YEARLY))
        assertEquals("Billed monthly. Switch to yearly and save $24", PlansLogic.note(BillingPeriod.MONTHLY))
    }

    @Test
    fun feedbackLimitsMatchTheDatabase() {
        val row = PlansLogic.groups.flatMap { it.rows }.first { it.label == "Writing AI feedback" }
        assertEquals(PlanCell.Text("1 per day"), row.free)
        assertEquals(PlanCell.Text("5 per day"), row.premium)
    }

    @Test
    fun premiumOnlyFeaturesAreNotOnFree() {
        val rows = PlansLogic.groups.flatMap { it.rows }.associateBy { it.label }
        assertEquals(PlanCell.NotIncluded, rows.getValue("Grammar chapter PDFs").free)
        assertEquals(PlanCell.Included, rows.getValue("Grammar chapter PDFs").premium)
        assertEquals(PlanCell.Text("Search only"), rows.getValue("Direct Kwiziq and TV5MONDE lesson links").free)
        assertTrue(rows.getValue("Progress and streaks").free == PlanCell.Included)
    }

    @Test
    fun placeholderBillingChargesNothingAndSaysNotConfigured() = runBlocking {
        assertEquals(PurchaseResult.NotConfigured, NotConfiguredBilling.purchase(BillingPeriod.YEARLY))
        assertEquals(PurchaseResult.NotConfigured, NotConfiguredBilling.manage())
    }
}
