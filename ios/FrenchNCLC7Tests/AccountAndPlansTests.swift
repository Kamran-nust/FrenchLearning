import XCTest
@testable import FrenchNCLC7

/// Tests for account deletion, password reset and the Plans page numbers (the same cases as the web and Android tests).
final class AccountAndPlansTests: XCTestCase {
    func testDeletingNeedsTheWordDeleteAndAPassword() {
        XCTAssertTrue(AccountLogic.canConfirmDelete(typed: "DELETE", password: "secret"))
        XCTAssertTrue(AccountLogic.canConfirmDelete(typed: " DELETE ", password: "secret"))
        XCTAssertFalse(AccountLogic.canConfirmDelete(typed: "delete", password: "secret"))
        XCTAssertFalse(AccountLogic.canConfirmDelete(typed: "DELETE", password: ""))
        XCTAssertFalse(AccountLogic.canConfirmDelete(typed: "", password: "secret"))
    }

    func testSuperAccountsCantBeDeleted() {
        XCTAssertTrue(AccountLogic.canDelete(.free))
        XCTAssertTrue(AccountLogic.canDelete(.premium))
        XCTAssertFalse(AccountLogic.canDelete(.superUser))
    }

    func testChecksAnEmailBeforeAskingForAResetLink() {
        XCTAssertTrue(AccountLogic.isEmail("me@example.com"))
        XCTAssertTrue(AccountLogic.isEmail("  me@example.com "))
        XCTAssertFalse(AccountLogic.isEmail("nope"))
        XCTAssertFalse(AccountLogic.isEmail("a b@c.com"))
        XCTAssertFalse(AccountLogic.isEmail(""))
    }

    func testTheResetMessageSaysNothingAboutWhetherTheAccountExists() {
        XCTAssertTrue(AccountLogic.resetSentMessage(" me@example.com ").hasPrefix("If an account exists for me@example.com"))
    }

    func testYearlySavesTwentyFourDollarsWhichIsTwoMonthsFree() {
        XCTAssertEqual(BillingPeriod.monthly.amount, 12)
        XCTAssertEqual(BillingPeriod.yearly.amount, 120)
        XCTAssertEqual(PlansLogic.yearlySaving, 24)
        XCTAssertEqual(PlansLogic.yearlyPerMonth, 10)
        XCTAssertEqual(PlansLogic.yearlyFreeMonths, 2)
        XCTAssertEqual(PlansLogic.note(.yearly), "$10 a month. 2 months free, save $24")
        XCTAssertEqual(PlansLogic.note(.monthly), "Billed monthly. Switch to yearly and save $24")
    }

    func testThePlansTableMatchesTheOtherApps() {
        let rows = Dictionary(uniqueKeysWithValues: PlansLogic.groups.flatMap { $0.rows }.map { ($0.label, $0) })
        XCTAssertEqual(rows["Writing AI feedback"]?.free, .text("1 per day"))
        XCTAssertEqual(rows["Writing AI feedback"]?.premium, .text("5 per day"))
        XCTAssertEqual(rows["Anki words per day"]?.free, .text("30 per day"))
        XCTAssertEqual(rows["Anki words per day"]?.premium, .text("200 per day"))
        XCTAssertEqual(rows["Grammar chapter PDFs"]?.free, .notIncluded)
        XCTAssertEqual(rows["Word Bank (your own words in Anki)"]?.free, .notIncluded)
        XCTAssertEqual(rows["Word Bank (your own words in Anki)"]?.premium, .text("Up to 500 of your own"))
    }

    func testPlaceholderBillingChargesNothingAndSaysNotConfigured() async {
        let billing = NotConfiguredBilling()
        let bought = await billing.purchase(.yearly)
        let managed = await billing.manage()
        XCTAssertEqual(bought, .notConfigured)
        XCTAssertEqual(managed, .notConfigured)
    }
}
