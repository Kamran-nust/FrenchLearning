import XCTest
@testable import FrenchNCLC7

final class DayPlanLogicTests: XCTestCase {
    private let repo = PlanRepository()

    private func content(_ day: Int) -> DayPlanContent {
        func d(_ s: PlanSection) -> DayContent { repo.days(s)[day - 1] }
        return DayPlanLogic.build(anki: d(.anki), grammar: d(.grammar), kwiziq: d(.kwiziq), tv5: d(.tv5), writing: d(.writing))
    }

    func testTheDayPlanHasTheFiveSectionsInTheWebAppsOrder() {
        let c = content(1)
        XCTAssertEqual(c.day, 1)
        XCTAssertEqual(c.week, 1)
        XCTAssertEqual(c.sections.map { $0.title }, ["Anki", "Grammar book", "Kwiziq", "TV5MONDE", "Writing"])
    }

    func testEachSectionCarriesThatDaysContent() {
        let c = content(1)
        XCTAssertEqual(c.sections[0].cards, repo.days(.anki)[0].cards)
        XCTAssertEqual(c.sections[0].note, "\(repo.days(.anki)[0].cards.count) new cards")
        XCTAssertEqual(c.sections[1].text, repo.days(.grammar)[0].text)
        XCTAssertEqual(c.sections[4].text, repo.days(.writing)[0].text)
        let kwiziqChips = repo.days(.kwiziq)[0].text.split(separator: ";").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        XCTAssertEqual(c.sections[2].items, kwiziqChips)
        // TV5: the level first (when the day has one), then the lessons, like the web app
        XCTAssertEqual(c.sections[3].items.first, "Première classe")
        XCTAssertEqual(c.sections[3].items.count, 1 + repo.days(.tv5)[0].text.split(separator: ";").count)
    }

    func testEveryRealDayBuildsACompletePlan() {
        for day in 1...301 {
            let c = content(day)
            XCTAssertEqual(c.day, day)
            XCTAssertEqual(c.week, (day + 6) / 7)
            XCTAssertFalse(c.sections[0].cards.isEmpty, "day \(day) anki")
            XCTAssertFalse((c.sections[1].text ?? "").isEmpty, "day \(day) grammar")
            XCTAssertFalse(c.sections[2].items.isEmpty, "day \(day) kwiziq")
            XCTAssertFalse(c.sections[3].items.isEmpty, "day \(day) tv5")
            XCTAssertFalse((c.sections[4].text ?? "").isEmpty, "day \(day) writing")
        }
    }

    func testTheFileIsNamedByDay() {
        XCTAssertEqual(DayPlanLogic.fileName(1), "French-NCLC7-Day-1.pdf")
        XCTAssertEqual(DayPlanLogic.fileName(109), "French-NCLC7-Day-109.pdf")
    }

    func testTheWaitIsShownInHoursAndMinutes() {
        let now = ISO8601DateFormatter().date(from: "2026-09-19T12:00:00Z")!
        XCTAssertEqual(DayPlanLogic.waitText(PdfQuota(allowed: false, resetsAt: "2026-09-19T17:12:00+00:00"), now: now), "Available again in 5h 12m")
        XCTAssertEqual(DayPlanLogic.waitText(PdfQuota(allowed: false, resetsAt: "2026-09-19T13:00:00.000000+00:00"), now: now), "Available again in 1h 0m")
        XCTAssertEqual(DayPlanLogic.waitText(PdfQuota(allowed: false, resetsAt: "2026-09-19T12:00:20+00:00"), now: now), "Available again in 1m")
    }

    func testTheDownloadAllowanceIsReadFromTheDatabaseReply() {
        let used = #"{"tier" : "premium", "allowed" : false, "resets_at" : "2026-09-20T16:17:12.162258+00:00"}"#
        XCTAssertEqual(DayPlanLogic.parseQuota(Data(used.utf8)), PdfQuota(allowed: false, resetsAt: "2026-09-20T16:17:12.162258+00:00"))
        XCTAssertEqual(DayPlanLogic.parseQuota(Data(#"{"tier":"super","allowed":true,"resets_at":null}"#.utf8)), PdfQuota(allowed: true, resetsAt: nil))
        XCTAssertEqual(DayPlanLogic.parseQuota(Data(#"{"tier":"free","allowed":false,"resets_at":null}"#.utf8)), PdfQuota(allowed: false, resetsAt: nil))
        XCTAssertNil(DayPlanLogic.parseQuota(Data("not json".utf8)))
        XCTAssertNil(DayPlanLogic.parseQuota(Data(#"{"tier":"premium"}"#.utf8)))
    }

    func testAReservationIsOnlyOkWhenTheDatabaseSaysSo() {
        let ok = #"{"ok":true,"id":7,"status":{"tier":"premium","allowed":false,"resets_at":"2026-09-20T16:17:12+00:00"}}"#
        XCTAssertEqual(DayPlanLogic.parseClaim(Data(ok.utf8)),
                       PdfClaim(ok: true, id: 7, status: PdfQuota(allowed: false, resetsAt: "2026-09-20T16:17:12+00:00")))
        let refused = DayPlanLogic.parseClaim(Data(#"{"ok":false,"status":{"tier":"premium","allowed":false,"resets_at":"2026-09-20T16:17:12+00:00"}}"#.utf8))
        XCTAssertFalse(refused.ok)
        XCTAssertNil(refused.id)
        // anything unreadable counts as refused, never as allowed
        XCTAssertFalse(DayPlanLogic.parseClaim(Data("not json".utf8)).ok)
        XCTAssertFalse(DayPlanLogic.parseClaim(Data(#"{"id":5}"#.utf8)).ok)
        XCTAssertFalse(DayPlanLogic.parseClaim(Data(#"{"ok":"yes","id":5}"#.utf8)).ok)
    }

    func testThePdfIsARealPdfAndFlowsOntoMorePagesWhenLong() {
        let day1 = DayPlanPdf.render(content(1), dateText: "Sep 19, 2026")
        XCTAssertTrue(day1.starts(with: Data("%PDF".utf8)))
        let cards = (1...70).map { AnkiCard(i: "c\($0)", f: "mot numéro \($0) à apprendre", e: "word number \($0) to learn") }
        let long = DayPlanContent(day: 77, week: 11, sections: [PlanPdfSection(title: "Anki", note: "70 new cards", cards: cards)])
        let bigger = DayPlanPdf.render(long, dateText: "Sep 19, 2026")
        XCTAssertGreaterThan(bigger.count, day1.count)
    }
}
