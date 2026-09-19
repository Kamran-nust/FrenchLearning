import XCTest
@testable import FrenchNCLC7

/// A predictable random source, so sessions can be checked without luck getting in the way.
struct SeededGenerator: RandomNumberGenerator {
    private var state: UInt64
    init(seed: UInt64) { state = seed &+ 0x9E3779B97F4A7C15 }
    mutating func next() -> UInt64 {
        state = state &+ 0x9E3779B97F4A7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
        z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
        return z ^ (z >> 31)
    }
}

final class AnkiLogicTests: XCTestCase {
    private let days = PlanRepository().days(.anki)

    private func session(_ day: Int, completed: Int, hard: Set<String> = [], seed: UInt64) -> AnkiSession? {
        var g = SeededGenerator(seed: seed)
        return AnkiLogic.buildSession(days: days, currentDay: day, completedCount: completed, hard: hard, using: &g)
    }

    func testReviewTargetGrowsFromFiveToFortyLikeTheWebApp() {
        XCTAssertEqual(AnkiLogic.reviewTarget(0), 5)
        XCTAssertEqual(AnkiLogic.reviewTarget(1), 5)
        XCTAssertEqual(AnkiLogic.reviewTarget(42), 10)
        XCTAssertEqual(AnkiLogic.reviewTarget(150), 23)   // 22.5 rounds up, as JavaScript's Math.round does
        XCTAssertEqual(AnkiLogic.reviewTarget(300), 40)
    }

    func testDayOneHasNewWordsOnlyAndAllOfThemAreFrenchToEnglish() {
        let s = session(1, completed: 0, seed: 1)!
        XCTAssertEqual(s.items.count, days[0].cards.count)
        XCTAssertEqual(s.reviewCount, 0)
        XCTAssertTrue(s.items.allSatisfy { $0.dir == .fe && $0.sourceDay == 1 })
        XCTAssertEqual(s.items[0].key, "d1c1-new-1")
        XCTAssertEqual(s.items[0].french, "bonjour")
        XCTAssertEqual(s.items[0].english, "hello")
    }

    func testLaterDaysAddReviewCardsFromEarlierDaysOnly() {
        let s = session(20, completed: 19, seed: 7)!
        let today = days[19].cards.count
        XCTAssertEqual(s.reviewCount, AnkiLogic.reviewTarget(19))
        XCTAssertEqual(s.items.count, today + s.reviewCount)
        let news = s.items.filter { $0.sourceDay == 20 }
        let reviews = s.items.filter { $0.sourceDay != 20 }
        XCTAssertEqual(news.count, today)
        XCTAssertEqual(Array(s.items.prefix(today)), news)   // new words come first
        XCTAssertTrue(reviews.allSatisfy { $0.sourceDay < 20 })
        XCTAssertTrue(news.allSatisfy { $0.dir == .fe })
        XCTAssertEqual(reviews.count, Set(reviews.map { $0.cardId }).count)   // no card is reviewed twice
    }

    func testTheSameSeedGivesTheSameSessionAndDifferentSeedsDiffer() {
        XCTAssertEqual(session(60, completed: 59, seed: 3), session(60, completed: 59, seed: 3))
        XCTAssertNotEqual(session(60, completed: 59, seed: 3), session(60, completed: 59, seed: 4))
    }

    func testReviewCardsGetBothDirections() {
        let review = session(120, completed: 119, seed: 11)!.items.filter { $0.sourceDay != 120 }
        XCTAssertTrue(review.contains { $0.dir == .ef })
        XCTAssertTrue(review.contains { $0.dir == .fe })
    }

    func testHardWordsComeUpMoreOften() {
        let allIds = days.filter { $0.day < 40 }.flatMap { $0.cards }.map { $0.i }
        let hard = Set(allIds.prefix(6))
        var hardPicked = 0
        var easyPicked = 0
        var g = SeededGenerator(seed: 99)
        for _ in 0..<1500 {
            let s = AnkiLogic.buildSession(days: days, currentDay: 40, completedCount: 39, hard: hard, using: &g)!
            for item in s.items where item.sourceDay != 40 {
                if hard.contains(item.cardId) { hardPicked += 1 } else { easyPicked += 1 }
            }
        }
        let hardRate = Double(hardPicked) / Double(1500 * hard.count)
        let easyRate = Double(easyPicked) / Double(1500 * (allIds.count - hard.count))
        // marked-hard cards weigh 5x, so they should be picked several times as often
        XCTAssertGreaterThan(hardRate, easyRate * 3)
    }

    func testADayThatDoesNotExistGivesNoSession() {
        XCTAssertNil(AnkiLogic.buildSession(days: days, currentDay: 0, completedCount: 0, hard: []))
        XCTAssertNil(AnkiLogic.buildSession(days: days, currentDay: 302, completedCount: 0, hard: []))
    }

    func testEveryRealDayBuildsAValidSession() {
        for day in 1...301 {
            guard let s = session(day, completed: day - 1, seed: UInt64(day)) else { return XCTFail("day \(day)") }
            let pool = days.filter { $0.day < day }.reduce(0) { $0 + $1.cards.count }
            let expectedReview = min(AnkiLogic.reviewTarget(day - 1), pool)
            XCTAssertEqual(s.items.count, days[day - 1].cards.count + expectedReview, "day \(day)")
            XCTAssertEqual(s.items.count, Set(s.items.map { $0.key }).count, "day \(day) keys unique")
        }
    }

    func testFinishingADayCountsEveryCardAsSeen() {
        let s = session(3, completed: 2, seed: 5)!
        let first = s.items[0].cardId
        let before = [first: CardStat(times_seen: 2, times_marked_hard_total: 1, last_seen_day: 2)]
        let after = AnkiLogic.markSeen(before, s)
        XCTAssertEqual(after[first]?.times_seen, 3)
        XCTAssertEqual(after[first]?.times_marked_hard_total, 1)
        XCTAssertEqual(after[first]?.last_seen_day, 3)
        XCTAssertTrue(s.items.allSatisfy { after[$0.cardId]?.last_seen_day == 3 })
        XCTAssertEqual(before[first]?.times_seen, 2)   // the input isn't modified
    }

    func testMarkingHardCountsEachTime() {
        var stats: [String: CardStat] = [:]
        stats = AnkiLogic.markHard(stats, "d1c1")
        stats = AnkiLogic.markHard(stats, "d1c1")
        XCTAssertEqual(stats["d1c1"]?.times_marked_hard_total, 2)
        XCTAssertEqual(stats["d1c1"]?.times_seen, 0)
        XCTAssertNil(stats["d1c1"]?.last_seen_day)
    }

    func testSavedFormatsMatchTheWebApp() {
        // hard-words is a JSON array of card ids; card-stats is an object keyed by card id
        XCTAssertEqual(AnkiLogic.decodeHard(#"["d1c1","d2c3"]"#), ["d1c1", "d2c3"])
        XCTAssertEqual(AnkiLogic.encodeHard(["d1c1", "d2c3"]), #"["d1c1","d2c3"]"#)
        XCTAssertEqual(AnkiLogic.encodeHard([]), "[]")

        let web = #"{"d1c1":{"times_seen":2,"times_marked_hard_total":1,"last_seen_day":3},"d1c2":{"times_seen":0,"times_marked_hard_total":1,"last_seen_day":null}}"#
        let stats = AnkiLogic.decodeStats(web)
        XCTAssertEqual(stats?["d1c1"], CardStat(times_seen: 2, times_marked_hard_total: 1, last_seen_day: 3))
        XCTAssertNil(stats?["d1c2"]?.last_seen_day)
        let back = AnkiLogic.encodeStats(stats ?? [:])
        XCTAssertTrue(back.contains("\"times_seen\":2"))
        XCTAssertTrue(back.contains("\"last_seen_day\":null"))
        XCTAssertEqual(AnkiLogic.decodeStats(back), stats)
        XCTAssertEqual(AnkiLogic.encodeStats([:]), "{}")
    }

    func testUnreadableSavedDataIsNotTreatedAsEmpty() {
        XCTAssertNil(AnkiLogic.decodeHard("not json"))
        XCTAssertNil(AnkiLogic.decodeHard("{}"))
        XCTAssertNil(AnkiLogic.decodeStats("not json"))
        XCTAssertNil(AnkiLogic.decodeStats("[1]"))
    }
}
