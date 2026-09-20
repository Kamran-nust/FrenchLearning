package com.frenchnclc7.app.data

/** Premium billing periods. The price shown here is display text; what Google Play charges is set in the Play Console. */
enum class BillingPeriod(val amount: Int, val price: String, val per: String) {
    MONTHLY(12, "$12", "/ month"),
    YEARLY(120, "$120", "/ year"),
}

/** One cell of the Free-versus-Premium table. */
sealed interface PlanCell {
    data object Included : PlanCell
    data object NotIncluded : PlanCell
    data class Text(val value: String) : PlanCell
}

data class PlanRow(val label: String, val free: PlanCell, val premium: PlanCell)
data class PlanGroup(val title: String, val rows: List<PlanRow>)

/** The numbers and wording on the Plans page (the same as the web app's Plans page). */
object PlansLogic {
    /** Daily AI writing feedback per tier; the database table tier_limits enforces these. */
    const val AI_FEEDBACK_FREE = 1
    const val AI_FEEDBACK_PREMIUM = 5

    /** Yearly compared with paying monthly for a year. */
    val yearlySaving: Int = BillingPeriod.MONTHLY.amount * 12 - BillingPeriod.YEARLY.amount
    val yearlyPerMonth: Int = BillingPeriod.YEARLY.amount / 12
    val yearlyFreeMonths: Int = yearlySaving / BillingPeriod.MONTHLY.amount

    fun note(period: BillingPeriod): String = when (period) {
        BillingPeriod.YEARLY -> "$$yearlyPerMonth a month. $yearlyFreeMonths months free, save $$yearlySaving"
        BillingPeriod.MONTHLY -> "Billed monthly. Switch to yearly and save $$yearlySaving"
    }

    const val NOT_SWITCHED_ON = "Purchases aren't switched on yet. Please check back soon."
    const val PURCHASE_FAILED = "Couldn't start the purchase. Try again in a moment."

    val groups: List<PlanGroup> = listOf(
        PlanGroup("Study", listOf(
            PlanRow("Anki, Grammar, Kwiziq, TV5MONDE, Writing", PlanCell.Included, PlanCell.Included),
            PlanRow("Progress and streaks", PlanCell.Included, PlanCell.Included),
            PlanRow("Word Bank (your own words in Anki)", PlanCell.NotIncluded, PlanCell.Text("Up to ${WordBankLogic.PREMIUM_OWN_LIMIT} of your own")),
        )),
        PlanGroup("Lessons and links", listOf(
            PlanRow("Direct Kwiziq and TV5MONDE lesson links", PlanCell.Text("Search only"), PlanCell.Included),
        )),
        PlanGroup("Downloads and AI", listOf(
            PlanRow("Anki words per day", PlanCell.Text("${AnkiLimits.FREE_DAILY} per day"), PlanCell.Text("${AnkiLimits.PREMIUM_DAILY} per day")),
            PlanRow("Grammar chapter PDFs", PlanCell.NotIncluded, PlanCell.Included),
            PlanRow("Day-plan PDF", PlanCell.NotIncluded, PlanCell.Text("1 per day")),
            PlanRow("Writing AI feedback", PlanCell.Text("$AI_FEEDBACK_FREE per day"), PlanCell.Text("$AI_FEEDBACK_PREMIUM per day")),
        )),
    )
}

/** What happened when the person tried to buy or manage a subscription. */
sealed interface PurchaseResult {
    /** Google Play Billing isn't connected yet (no Play Console subscription products). */
    data object NotConfigured : PurchaseResult
    data object Failed : PurchaseResult
}

/**
 * The one place the app talks to Google Play Billing. Android requires Google's own billing for
 * subscriptions sold inside the app, so this is where the real implementation goes later
 * (BillingClient: query the two subscription products, launch the purchase flow, send the purchase
 * token to the server, which then sets the account's tier). Until then [NotConfiguredBilling] is used.
 */
interface PlayBilling {
    suspend fun purchase(period: BillingPeriod): PurchaseResult
    suspend fun manage(): PurchaseResult
}

/** Placeholder used until Google Play Billing is set up: nothing is charged and nothing is asked for. */
object NotConfiguredBilling : PlayBilling {
    override suspend fun purchase(period: BillingPeriod): PurchaseResult = PurchaseResult.NotConfigured
    override suspend fun manage(): PurchaseResult = PurchaseResult.NotConfigured
}
