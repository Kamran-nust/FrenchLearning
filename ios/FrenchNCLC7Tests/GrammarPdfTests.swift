import XCTest
@testable import FrenchNCLC7

final class GrammarPdfTests: XCTestCase {
    private let days = PlanRepository().days(.grammar)

    func testDayOneOpensChaptersOneAndFourOfTheFirstBook() {
        XCTAssertEqual(days[0].chapters, [BookChapters(book: "A1-A2", chapters: [1, 4])])
        XCTAssertEqual(days[0].chapters[0].label, "A1-A2 ch. 1, 4")
    }

    func testEntriesAreGroupedByBookInFirstSeenOrder() {
        let groups = GrammarBooks.group([("A1-A2", [3]), ("A2-B1", [10]), ("A1-A2", [5, 6])])
        XCTAssertEqual(groups, [BookChapters(book: "A1-A2", chapters: [3, 5, 6]), BookChapters(book: "A2-B1", chapters: [10])])
        XCTAssertEqual(groups[1].label, "A2-B1 ch. 10")
        XCTAssertTrue(GrammarBooks.group([]).isEmpty)
    }

    func testEveryRealDayOnlyUsesTheThreeBooksAndOneGroupPerBook() {
        var daysWithChapters = 0
        for d in days {
            if !d.chapters.isEmpty { daysWithChapters += 1 }
            XCTAssertTrue(d.chapters.allSatisfy { ["A1-A2", "A2-B1", "B1-B2"].contains($0.book) && !$0.chapters.isEmpty }, "day \(d.day)")
            XCTAssertEqual(d.chapters.count, Set(d.chapters.map { $0.book }).count, "day \(d.day): one group per book")
        }
        // Grammar plan days that name no book (revision days) have no PDF button, like the web app.
        XCTAssertGreaterThan(daysWithChapters, 100)
    }

    func testOtherSectionsHaveNoChapters() {
        XCTAssertTrue(PlanRepository().days(.kwiziq).allSatisfy { $0.chapters.isEmpty })
    }

    func testOnlyPremiumAndSuperPassTheTierCheck() {
        XCTAssertFalse(Tier.free.atLeast(.premium))
        XCTAssertTrue(Tier.premium.atLeast(.premium))
        XCTAssertTrue(Tier.superUser.atLeast(.premium))
        XCTAssertFalse(Tier.premium.atLeast(.superUser))
        // an unknown tier counts as free, so it never unlocks the PDFs
        XCTAssertFalse(Tier.from("gold").atLeast(.premium))
        XCTAssertFalse(Tier.from(nil).atLeast(.premium))
    }
}
