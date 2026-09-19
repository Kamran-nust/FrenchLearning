import XCTest
@testable import FrenchNCLC7

final class StudyLogicTests: XCTestCase {
    private var calendar: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(secondsFromGMT: 0)!
        return c
    }

    private func date(_ y: Int, _ m: Int, _ d: Int) -> Date {
        calendar.date(from: DateComponents(year: y, month: m, day: d, hour: 12))!
    }

    private let todayKey = "Tue Mar 10 2026"
    private let yesterdayKey = "Mon Mar 09 2026"

    func testDatesAreWrittenTheWayTheWebAppWritesThem() {
        // JavaScript's Date.toDateString(): weekday, month, zero-padded day, year
        XCTAssertEqual(StudyLogic.dateKey(date(2026, 3, 10), calendar: calendar), "Tue Mar 10 2026")
        XCTAssertEqual(StudyLogic.dateKey(date(2026, 9, 19), calendar: calendar), "Sat Sep 19 2026")
        XCTAssertEqual(StudyLogic.dateKey(date(2026, 1, 1), calendar: calendar), "Thu Jan 01 2026")
    }

    func testFirstCompletionStartsAStreakOfOneAndMovesToDayTwo() {
        let done = StudyLogic.completeDay(SectionProgress(), day: 1, today: date(2026, 3, 10), calendar: calendar)
        XCTAssertEqual(done.streak, 1)
        XCTAssertEqual(done.progress, SectionProgress(current_day: 2, completed_days: [1], last_activity_date: todayKey,
                                                      streak_count: 1, longest_streak: 1))
    }

    func testStreakGrowsWhenYesterdayWasActive() {
        let before = SectionProgress(current_day: 4, completed_days: [1, 2, 3], last_activity_date: yesterdayKey,
                                     streak_count: 3, longest_streak: 3)
        let done = StudyLogic.completeDay(before, day: 4, today: date(2026, 3, 10), calendar: calendar)
        XCTAssertEqual(done.streak, 4)
        XCTAssertEqual(done.progress.longest_streak, 4)
        XCTAssertEqual(done.progress.completed_days, [1, 2, 3, 4])
    }

    func testSecondCompletionOnTheSameDayLeavesTheStreakAlone() {
        let before = SectionProgress(current_day: 3, completed_days: [1, 2], last_activity_date: todayKey,
                                     streak_count: 2, longest_streak: 2)
        let done = StudyLogic.completeDay(before, day: 3, today: date(2026, 3, 10), calendar: calendar)
        XCTAssertEqual(done.streak, 2)
        XCTAssertEqual(done.progress.current_day, 4)
    }

    func testAGapRestartsTheStreakButKeepsTheLongest() {
        let before = SectionProgress(current_day: 10, completed_days: Array(1...9), last_activity_date: "Thu Mar 05 2026",
                                     streak_count: 9, longest_streak: 9)
        let done = StudyLogic.completeDay(before, day: 10, today: date(2026, 3, 10), calendar: calendar)
        XCTAssertEqual(done.streak, 1)
        XCTAssertEqual(done.progress.longest_streak, 9)
    }

    func testProgressSavedByTheWebAppIsReadCorrectly() {
        let web = #"{"current_day":5,"completed_days":[1,2,3,4],"last_activity_date":"Mon Mar 09 2026","streak_count":4,"longest_streak":7}"#
        let p = StudyLogic.decode(web)
        XCTAssertEqual(p?.current_day, 5)
        XCTAssertEqual(p?.completed_days, [1, 2, 3, 4])
        XCTAssertEqual(p?.last_activity_date, yesterdayKey)
        XCTAssertEqual(p?.longest_streak, 7)
        let fresh = #"{"current_day":1,"completed_days":[],"last_activity_date":null,"streak_count":0,"longest_streak":0}"#
        XCTAssertNotNil(StudyLogic.decode(fresh))
        XCTAssertNil(StudyLogic.decode(fresh)?.last_activity_date)
    }

    func testUnreadableProgressIsNotTreatedAsEmpty() {
        XCTAssertNil(StudyLogic.decode("not json"))
        XCTAssertNil(StudyLogic.decode(#"{"current_day":"five"}"#))
    }

    func testSavedProgressUsesTheSameFieldNamesAsTheWebApp() {
        let text = StudyLogic.encode(SectionProgress(current_day: 2, completed_days: [1], last_activity_date: todayKey,
                                                     streak_count: 1, longest_streak: 1))
        for field in ["current_day", "completed_days", "last_activity_date", "streak_count", "longest_streak"] {
            XCTAssertTrue(text.contains("\"\(field)\""), field)
        }
        XCTAssertEqual(StudyLogic.decode(text), SectionProgress(current_day: 2, completed_days: [1], last_activity_date: todayKey,
                                                                streak_count: 1, longest_streak: 1))
        // a fresh section writes last_activity_date as null, like the web app
        XCTAssertTrue(StudyLogic.encode(SectionProgress()).contains("\"last_activity_date\":null"))
    }

    private func day(_ text: String, badge: String? = nil) -> DayContent {
        DayContent(day: 1, week: 1, badge: badge, text: text, cards: [])
    }

    func testKwiziqDaysSplitIntoChips() {
        let d = day("Conjugate être; subject pronouns ;; je, tu")
        XCTAssertEqual(LessonChips.chips(.kwiziq, d), ["Conjugate être", "subject pronouns", "je, tu"])
        XCTAssertEqual(LessonChips.body(.kwiziq, d), d.text)
    }

    func testTv5DropsTheLevelPrefixAndJoinsTheBody() {
        let d = day("Première classe: Les salutations / Se présenter", badge: "Première classe")
        XCTAssertEqual(LessonChips.chips(.tv5, d), ["Les salutations / Se présenter"])
        XCTAssertEqual(LessonChips.body(.tv5, d), "Les salutations / Se présenter")
        XCTAssertEqual(LessonChips.body(.tv5, day("A2-B1 : un; deux")), "un · deux")
    }

    func testGrammarAndWritingHaveNoChips() {
        XCTAssertTrue(LessonChips.chips(.grammar, day("Ch. 1")).isEmpty)
        XCTAssertTrue(LessonChips.chips(.writing, day("Write 5 lines")).isEmpty)
    }

    func testSearchLinksMatchTheWebApp() {
        XCTAssertEqual(LessonChips.searchURL(.kwiziq, "noun gender")?.absoluteString,
                       "https://www.google.com/search?q=site%3Afrench.kwiziq.com%20noun%20gender")
        XCTAssertTrue(LessonChips.searchURL(.tv5, "les salutations")?.absoluteString.contains("site%3Atv5monde.com%20les%20salutations") == true)
    }
}
