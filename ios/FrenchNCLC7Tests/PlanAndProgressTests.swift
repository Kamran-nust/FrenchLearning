import XCTest
@testable import FrenchNCLC7

final class PlanAndProgressTests: XCTestCase {
    private let repo = PlanRepository()

    func testEverySectionHas301DaysInOrder() {
        for section in PlanSection.allCases {
            let days = repo.days(section)
            XCTAssertEqual(days.count, totalDays, section.title)
            for (i, d) in days.enumerated() {
                XCTAssertEqual(d.day, i + 1)
                XCTAssertEqual(d.week, (d.day + 6) / 7)
            }
        }
    }

    func testAnkiDaysHaveCards() {
        let days = repo.days(.anki)
        XCTAssertTrue(days.allSatisfy { !$0.cards.isEmpty && $0.cards.allSatisfy { !$0.f.isEmpty && !$0.e.isEmpty } })
        XCTAssertEqual(days[0].cards[0].f, "bonjour")
        XCTAssertEqual(days[0].cards[0].e, "hello")
    }

    func testTv5DaysCarryTheLevelBadge() {
        XCTAssertEqual(repo.days(.tv5)[0].badge, "Première classe")
    }

    func testCompletedDaysParsesTheSavedProgressJSON() {
        XCTAssertEqual(PlanProgress.completedDays(#"{"current_day":4,"completed_days":[1,2,3],"streak_count":3}"#), [1, 2, 3])
        XCTAssertEqual(PlanProgress.completedDays(nil), [])
        XCTAssertEqual(PlanProgress.completedDays("not json"), [])
        XCTAssertEqual(PlanProgress.completedDays(#"{"current_day":1}"#), [])
    }

    func testFullyCompletedThroughIsTheHighestDayEverySectionFinished() {
        let a = Set(1...10), b = Set(1...7), c = Set(1...9)
        XCTAssertEqual(PlanProgress.fullyCompletedThrough([a, b, c]), 7)
        XCTAssertEqual(PlanProgress.fullyCompletedThrough([[1, 2, 4, 5], [1, 2, 4, 5]]), 2)   // stops at the first gap
        XCTAssertEqual(PlanProgress.fullyCompletedThrough([a, []]), 0)                        // nothing saved in one section
        XCTAssertEqual(PlanProgress.fullyCompletedThrough([Set(1...20)], total: 10), 10)      // never above the total
        XCTAssertEqual(PlanProgress.fullyCompletedThrough([]), 0)
    }

    func testUnknownTiersCountAsFree() {
        XCTAssertEqual(Tier.from("premium"), .premium)
        XCTAssertEqual(Tier.from("SUPER"), .superUser)
        XCTAssertEqual(Tier.from(nil), .free)
        XCTAssertEqual(Tier.from("gold"), .free)
    }
}
