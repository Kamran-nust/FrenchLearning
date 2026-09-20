import Foundation

/// Premium billing periods. The price shown here is display text; what Apple charges is set in App Store Connect.
enum BillingPeriod: CaseIterable, Equatable {
    case monthly, yearly

    var amount: Int { self == .monthly ? 12 : 120 }
    var price: String { self == .monthly ? "$12" : "$120" }
    var per: String { self == .monthly ? "/ month" : "/ year" }
    var label: String { self == .monthly ? "Monthly" : "Yearly" }
}

/// One cell of the Free-versus-Premium table.
enum PlanCell: Equatable {
    case included
    case notIncluded
    case text(String)
}

struct PlanRow: Equatable, Identifiable {
    let label: String
    let free: PlanCell
    let premium: PlanCell
    var id: String { label }
}

struct PlanGroup: Equatable, Identifiable {
    let title: String
    let rows: [PlanRow]
    var id: String { title }
}

/// The numbers and wording on the Plans page (the same as the web and Android apps).
enum PlansLogic {
    /// Daily AI writing feedback per tier; the database table tier_limits enforces these.
    static let aiFeedbackFree = 1
    static let aiFeedbackPremium = 5

    /// Yearly compared with paying monthly for a year.
    static let yearlySaving = BillingPeriod.monthly.amount * 12 - BillingPeriod.yearly.amount
    static let yearlyPerMonth = BillingPeriod.yearly.amount / 12
    static let yearlyFreeMonths = yearlySaving / BillingPeriod.monthly.amount

    static func note(_ period: BillingPeriod) -> String {
        switch period {
        case .yearly: return "$\(yearlyPerMonth) a month. \(yearlyFreeMonths) months free, save $\(yearlySaving)"
        case .monthly: return "Billed monthly. Switch to yearly and save $\(yearlySaving)"
        }
    }

    static let notSwitchedOn = "Purchases aren't switched on yet. Please check back soon."
    static let purchaseFailed = "Couldn't start the purchase. Try again in a moment."

    static let groups: [PlanGroup] = [
        PlanGroup(title: "Study", rows: [
            PlanRow(label: "Anki, Grammar, Kwiziq, TV5MONDE, Writing", free: .included, premium: .included),
            PlanRow(label: "Progress and streaks", free: .included, premium: .included),
            PlanRow(label: "Word Bank (your own words in Anki)", free: .notIncluded,
                    premium: .text("Up to \(WordBankLogic.premiumOwnLimit) of your own")),
        ]),
        PlanGroup(title: "Lessons and links", rows: [
            PlanRow(label: "Direct Kwiziq and TV5MONDE lesson links", free: .text("Search only"), premium: .included),
        ]),
        PlanGroup(title: "Downloads and AI", rows: [
            PlanRow(label: "Anki words per day", free: .text("\(AnkiLimits.freeDaily) per day"), premium: .text("\(AnkiLimits.premiumDaily) per day")),
            PlanRow(label: "Grammar chapter PDFs", free: .notIncluded, premium: .included),
            PlanRow(label: "Day-plan PDF", free: .notIncluded, premium: .text("1 per day")),
            PlanRow(label: "Writing AI feedback", free: .text("\(aiFeedbackFree) per day"), premium: .text("\(aiFeedbackPremium) per day")),
        ]),
    ]
}

/// What happened when the person tried to buy or manage a subscription.
enum PurchaseResult: Equatable {
    /// In-app purchases aren't connected yet (no App Store Connect subscription products).
    case notConfigured
    case failed
}

/// The one place the app talks to Apple's In-App Purchase (StoreKit). Apple requires its own billing for
/// subscriptions sold inside the app, so the real implementation goes here later (load the two subscription
/// products, run the purchase, send the receipt to the server, which then sets the account's tier).
/// Until then `NotConfiguredBilling` is used.
protocol AppStoreBilling {
    func purchase(_ period: BillingPeriod) async -> PurchaseResult
    func manage() async -> PurchaseResult
}

/// Placeholder used until In-App Purchase is set up: nothing is charged and nothing is asked for.
struct NotConfiguredBilling: AppStoreBilling {
    func purchase(_ period: BillingPeriod) async -> PurchaseResult { .notConfigured }
    func manage() async -> PurchaseResult { .notConfigured }
}
