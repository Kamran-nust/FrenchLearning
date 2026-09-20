import XCTest
@testable import FrenchNCLC7

/// Tests for the Word Bank rules and the Anki daily limits (the same cases as the web and Android tests).
final class WordBankAndLimitsTests: XCTestCase {
    private let days = PlanRepository().days(.anki)
    private let bank: [AnkiLogic.Pooled] = (0..<200).map { (card: AnkiCard(i: "wb:\($0)", f: "f\($0)", e: "e\($0)"), day: 1) }

    private func word(_ id: String, _ french: String, _ english: String, starter: Int? = nil, hidden: Bool = false,
                      note: String? = nil, created: String? = nil) -> WordBankWord {
        WordBankWord(id: id, french: french, english: english, note: note, starter_id: starter, hidden: hidden,
                     added_day: 3, created_at: created ?? "2026-01-0\(id)")
    }

    private func session(done: Int, tier: Tier?, custom: [AnkiLogic.Pooled] = [], practice: Bool = false, seen: Int = 0) -> AnkiSession {
        var g = SeededGenerator(seed: 3)
        return AnkiLogic.buildSession(days: days, currentDay: done + 1, completedCount: done, hard: [], custom: custom,
                                      tier: tier, practice: practice, seen: seen, using: &g)!
    }

    // MARK: Daily limits

    func testLimitsAreThirtyFreeTwoHundredPremiumAndNoneForSuper() {
        XCTAssertEqual(AnkiLimits.dailyLimit(.free), 30)
        XCTAssertEqual(AnkiLimits.dailyLimit(.premium), 200)
        XCTAssertNil(AnkiLimits.dailyLimit(.superUser))
    }

    func testCountsOnlyTodaysSavedTotal() {
        XCTAssertEqual(AnkiLimits.todaysCount(#"{"date":"Sat Sep 19 2026","seen":12}"#, today: "Sat Sep 19 2026"), 12)
        XCTAssertEqual(AnkiLimits.todaysCount(#"{"date":"Fri Sep 18 2026","seen":12}"#, today: "Sat Sep 19 2026"), 0)
        XCTAssertEqual(AnkiLimits.todaysCount(nil, today: "x"), 0)
        XCTAssertEqual(AnkiLimits.todaysCount("not json", today: "x"), 0)
        XCTAssertEqual(AnkiLimits.todaysCount(AnkiLimits.encodeCount(date: "d", seen: 3), today: "d"), 3)
    }

    func testWorksOutWhatIsLeftAndWhenTheLimitIsReached() {
        XCTAssertEqual(AnkiLimits.remainingToday(.free, seen: 12), 18)
        XCTAssertEqual(AnkiLimits.remainingToday(.free, seen: 45), 0)
        XCTAssertNil(AnkiLimits.remainingToday(.superUser, seen: 9999))
        XCTAssertFalse(AnkiLimits.limitReached(.free, seen: 29))
        XCTAssertTrue(AnkiLimits.limitReached(.free, seen: 30))
        XCTAssertFalse(AnkiLimits.limitReached(.premium, seen: 199))
        XCTAssertFalse(AnkiLimits.limitReached(.superUser, seen: 100000))
    }

    func testADaysOwnSessionIsHeldToTheLimitButPracticeGetsWhatIsLeft() {
        XCTAssertEqual(AnkiLimits.sessionCap(.free, practice: false, seen: 12), 30)
        XCTAssertEqual(AnkiLimits.sessionCap(.free, practice: true, seen: 12), 18)
        XCTAssertEqual(AnkiLimits.sessionCap(.premium, practice: true, seen: 190), 10)
        XCTAssertNil(AnkiLimits.sessionCap(.superUser, practice: true, seen: 5000))
    }

    func testSuperDayStepsSteadilyFromTwentyFiveToFifty() {
        XCTAssertEqual(AnkiLimits.superDayTotal(0), 25)
        XCTAssertEqual(AnkiLimits.superDayTotal(150), 38)
        XCTAssertEqual(AnkiLimits.superDayTotal(300), 50)
        XCTAssertEqual(AnkiLimits.superDayTotal(301), 50)
        var last = 0
        for d in 0...300 {
            let t = AnkiLimits.superDayTotal(d)
            XCTAssertGreaterThanOrEqual(t, last)
            last = t
        }
    }

    // MARK: Session size by tier

    func testWithoutATierSessionsAreSizedAsBefore() {
        XCTAssertEqual(session(done: 150, tier: nil).items.count, days[150].cards.count + AnkiLogic.reviewTarget(150))
    }

    func testAFreeDayIsHeldToThirtyLateInThePlan() {
        let s = session(done: 300, tier: .free)
        XCTAssertEqual(s.items.count, 30)
        XCTAssertEqual(s.items.filter { $0.key.contains("-new-") }.count, days[300].cards.count)
        XCTAssertEqual(session(done: 50, tier: .free).items.count, days[50].cards.count + AnkiLogic.reviewTarget(50))
    }

    func testPracticeGetsOnlyWhatIsLeftOfTodaysAllowance() {
        XCTAssertEqual(session(done: 300, tier: .free, practice: true, seen: 22).items.count, 8)
        XCTAssertEqual(session(done: 300, tier: .free, practice: true, seen: 30).items.count, 0)
    }

    func testPremiumGetsTheFullDay() {
        XCTAssertEqual(session(done: 300, tier: .premium).items.count, days[300].cards.count + 40)
    }

    func testASuperDayIsAtLeastTwentyFiveFromDayOneRisingToFifty() {
        XCTAssertEqual(session(done: 0, tier: .superUser, custom: bank).items.count, 25)
        XCTAssertEqual(session(done: 150, tier: .superUser, custom: bank).items.count, 38)
        XCTAssertEqual(session(done: 300, tier: .superUser, custom: bank).items.count, 50)
        XCTAssertEqual(session(done: 300, tier: .superUser, custom: bank, practice: true, seen: 9999).items.count, 50)
    }

    func testWordBankWordsAreReviewCardsNeverNew() {
        let s = session(done: 29, tier: .premium, custom: bank)
        let mine = s.items.filter { $0.custom }
        XCTAssertFalse(mine.isEmpty)
        XCTAssertLessThanOrEqual(mine.count, (s.reviewCount + 3) / 4)
        XCTAssertTrue(mine.allSatisfy { $0.key.contains("-rev-") && $0.cardId.hasPrefix("wb:") })
        XCTAssertEqual(s.items.filter { $0.key.contains("-new-") }.count, days[29].cards.count)
    }

    func testDayOneReviewsAreFilledFromTheWordBank() {
        let s = session(done: 0, tier: .premium, custom: bank)
        XCTAssertEqual(s.reviewCount, 5)
        XCTAssertEqual(s.items.filter { $0.custom }.count, 5)
    }

    // MARK: Word Bank rules

    func testPremiumMayAddFiveHundredOwnWordsAndStarterWordsDontCount() {
        XCTAssertEqual(WordBankLogic.ownLimit(.free), 0)
        XCTAssertEqual(WordBankLogic.ownLimit(.premium), 500)
        XCTAssertGreaterThan(WordBankLogic.ownLimit(.superUser), 10000)
        XCTAssertEqual(WordBankLogic.ownCount([word("1", "bonjour", "hello", starter: 1), word("2", "le pain", "bread")]), 1)
        let full = (0..<500).map { word("x\($0)", "mot\($0)", "word\($0)") }
        XCTAssertFalse(WordBankLogic.hasRoom(.premium, full))
        XCTAssertTrue(WordBankLogic.hasRoom(.superUser, full))
        XCTAssertFalse(WordBankLogic.hasRoom(.free, []))
    }

    func testTidiesAndValidatesWhatIsTyped() {
        let c = WordBankLogic.clean(french: "  le   pain ", english: " bread ", note: "  ")
        XCTAssertEqual(c, WordBankLogic.Clean(french: "le pain", english: "bread", note: nil))
        XCTAssertEqual(WordBankLogic.validate(french: "", english: "x", note: ""), "Enter the French word.")
        XCTAssertEqual(WordBankLogic.validate(french: "x", english: "  ", note: ""), "Enter the English meaning.")
        XCTAssertNotNil(WordBankLogic.validate(french: String(repeating: "x", count: 201), english: "y", note: ""))
        XCTAssertNil(WordBankLogic.validate(french: "le pain", english: "bread", note: ""))
    }

    func testSpotsDuplicatesIgnoringCaseAndHiddenWords() {
        let words = [word("1", "Le Pain", "Bread"), word("2", "l'eau", "water", hidden: true)]
        XCTAssertTrue(WordBankLogic.isDuplicate(words, french: "le pain", english: "bread"))
        XCTAssertFalse(WordBankLogic.isDuplicate(words, french: "le pain", english: "bread", ignoring: "1"))
        XCTAssertFalse(WordBankLogic.isDuplicate(words, french: "l'eau", english: "water"))
    }

    func testSearchesAllThreeFieldsAndListsOwnWordsFirst() {
        let words = [
            word("1", "bonjour", "hello", starter: 1),
            word("2", "le pain", "bread", note: "boulangerie"),
            word("3", "l'eau", "water", created: "2026-02-01"),
        ]
        XCTAssertEqual(WordBankLogic.filter(words, query: "boulang").map { $0.id }, ["2"])
        XCTAssertEqual(WordBankLogic.filter(words, query: "HELLO").map { $0.id }, ["1"])
        XCTAssertEqual(WordBankLogic.sortForDisplay(words).map { $0.id }, ["3", "2", "1"])
    }

    func testTurnsWordsIntoAnkiCardsWithSafeIdsAndLeavesHiddenOnesOut() {
        let cards = WordBankLogic.toCards([word("a1", "le pain", "bread"), word("a2", "l'eau", "water", hidden: true)])
        XCTAssertEqual(cards.count, 1)
        XCTAssertEqual(cards[0].card, AnkiCard(i: "wb:a1", f: "le pain", e: "bread"))
        XCTAssertEqual(cards[0].day, 3)
    }

    func testSplitsReviewSlotsLikeTheWebApp() {
        XCTAssertEqual(WordBankLogic.splitReviewSlots(target: 20, builtin: 500, custom: 300), ReviewSplit(builtin: 15, custom: 5))
        XCTAssertEqual(WordBankLogic.splitReviewSlots(target: 5, builtin: 100, custom: 100), ReviewSplit(builtin: 3, custom: 2))
        XCTAssertEqual(WordBankLogic.splitReviewSlots(target: 5, builtin: 0, custom: 148), ReviewSplit(builtin: 0, custom: 5))
        XCTAssertEqual(WordBankLogic.splitReviewSlots(target: 5, builtin: 3, custom: 148), ReviewSplit(builtin: 3, custom: 2))
        XCTAssertEqual(WordBankLogic.splitReviewSlots(target: 5, builtin: 0, custom: 2), ReviewSplit(builtin: 0, custom: 2))
        XCTAssertEqual(WordBankLogic.splitReviewSlots(target: 5, builtin: 100, custom: 0), ReviewSplit(builtin: 5, custom: 0))
        XCTAssertEqual(WordBankLogic.splitReviewSlots(target: 5, builtin: 2, custom: 0), ReviewSplit(builtin: 2, custom: 0))
    }

    func testReadsWhatTheDatabaseReturns() throws {
        let body = #"""
        [{"id":"7d81","user_id":"u","french":"le fromage","english":"cheese","note":null,"starter_id":null,"hidden":false,"added_day":7,"created_at":"2026-09-20T01:00:00+00:00"},
         {"id":"9","user_id":"u","french":"bonjour","english":"Hello","note":null,"starter_id":12,"hidden":true,"added_day":1,"created_at":"x"}]
        """#
        let list = try XCTUnwrap(WordBankLogic.parseList(Data(body.utf8)))
        XCTAssertEqual(list.count, 2)
        XCTAssertEqual(list[0].added_day, 7)
        XCTAssertNil(list[0].starter_id)
        XCTAssertEqual(list[1].starter_id, 12)
        XCTAssertTrue(list[1].hidden)
        XCTAssertNil(WordBankLogic.parseList(Data("nope".utf8)))
    }
}
