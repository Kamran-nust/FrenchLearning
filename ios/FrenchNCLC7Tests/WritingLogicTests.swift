import XCTest
@testable import FrenchNCLC7

final class WritingLogicTests: XCTestCase {
    func testWordTargetsAreReadFromTheTask() {
        XCTAssertEqual(WritingLogic.extractWordTarget("Write a 60-word paragraph about yourself."), 60)
        XCTAssertEqual(WritingLogic.extractWordTarget("Write 80 words about your day"), 80)
        XCTAssertEqual(WritingLogic.extractWordTarget("Aim for 120 Words."), 120)
        XCTAssertNil(WritingLogic.extractWordTarget("Write 5-6 lines introducing yourself."))
    }

    func testWordsAreCountedByWhitespace() {
        XCTAssertEqual(WritingLogic.countWords(""), 0)
        XCTAssertEqual(WritingLogic.countWords("   \n  "), 0)
        XCTAssertEqual(WritingLogic.countWords("Bonjour, je m'appelle"), 3)
        XCTAssertEqual(WritingLogic.countWords("  un  deux\ntrois\tquatre "), 4)
    }

    func testWaitTimeIsShownInHoursAndMinutes() {
        XCTAssertEqual(WritingLogic.formatWait(0), "1m")
        XCTAssertEqual(WritingLogic.formatWait(30), "1m")
        XCTAssertEqual(WritingLogic.formatWait(12 * 60), "12m")
        XCTAssertEqual(WritingLogic.formatWait(12 * 60 + 1), "13m")
        XCTAssertEqual(WritingLogic.formatWait(60 * 60), "1h 0m")
        XCTAssertEqual(WritingLogic.formatWait((5 * 60 + 12) * 60), "5h 12m")
    }

    func testEntriesUseTheWebAppsFormat() {
        let entries: [Int: WritingEntry] = [
            3: WritingEntry(text: "Bonjour"),
            5: WritingEntry(text: "Salut", feedback: "Très bien !"),
        ]
        let text = WritingLogic.encodeEntries(entries)
        // keyed by day number, and a missing feedback is left out (like JavaScript's undefined)
        XCTAssertTrue(text.contains("\"3\":{\"text\":\"Bonjour\"}"))
        XCTAssertTrue(text.contains("\"feedback\":\"Très bien !\""))
        XCTAssertFalse(text.contains("null"))
        XCTAssertEqual(WritingLogic.decodeEntries(text), entries)
    }

    func testEntriesSavedByTheWebAppAreReadCorrectly() {
        let web = #"{"1":{"text":"Je m'appelle Kamran.","feedback":"Bien!\nContinue."},"2":{"text":"Salut"}}"#
        let entries = WritingLogic.decodeEntries(web)
        XCTAssertEqual(entries?[1]?.text, "Je m'appelle Kamran.")
        XCTAssertEqual(entries?[1]?.feedback, "Bien!\nContinue.")
        XCTAssertNil(entries?[2]?.feedback)
        XCTAssertEqual(WritingLogic.decodeEntries("{}"), [:])
    }

    func testUnreadableEntriesAreNotTreatedAsEmpty() {
        XCTAssertNil(WritingLogic.decodeEntries("not json"))
        XCTAssertNil(WritingLogic.decodeEntries("[1,2]"))
    }

    func testQuotaLimitReachedFollowsTheWebAppsRule() {
        let now = ISO8601DateFormatter().date(from: "2026-09-19T12:00:00Z")!
        let later = "2026-09-20T12:00:00.162258+00:00"
        let earlier = "2026-09-19T11:00:00+00:00"
        XCTAssertTrue(FeedbackQuota(limit: 1, used: 1, remaining: 0, resetsAt: later).limitReached(now: now))
        XCTAssertFalse(FeedbackQuota(limit: 1, used: 1, remaining: 0, resetsAt: earlier).limitReached(now: now))  // wait is over
        XCTAssertFalse(FeedbackQuota(limit: 5, used: 2, remaining: 3, resetsAt: nil).limitReached(now: now))      // some left
        XCTAssertFalse(FeedbackQuota(limit: nil, used: 9, remaining: nil, resetsAt: nil).limitReached(now: now))  // unlimited (super)
        let wait = FeedbackQuota(limit: 1, used: 1, remaining: 0, resetsAt: later).secondsUntilReset(now: now)
        XCTAssertEqual(wait, 24 * 60 * 60 + 0.162258, accuracy: 0.001)
    }

    private func body(_ text: String) -> Data { Data(text.utf8) }

    func testSuccessfulFeedbackIsParsedWithTheUpdatedAllowance() {
        let json = #"{"feedback":"Très bien.\nAttention aux accords.","quota":{"tier":"premium","limit":5,"used":2,"remaining":3,"resets_at":null}}"#
        XCTAssertEqual(FeedbackParser.outcome(status: 200, body: body(json)),
                       .success("Très bien.\nAttention aux accords.", FeedbackQuota(limit: 5, used: 2, remaining: 3, resetsAt: nil)))
    }

    func testSuperUsersHaveNoLimit() {
        let json = #"{"feedback":"Bien.","quota":{"tier":"super","limit":null,"used":7,"remaining":null,"resets_at":null}}"#
        XCTAssertEqual(FeedbackParser.outcome(status: 200, body: body(json)),
                       .success("Bien.", FeedbackQuota(limit: nil, used: 7, remaining: nil, resetsAt: nil)))
    }

    func testTheDailyLimitIsRecognised() {
        let json = #"{"error":"Daily AI feedback limit reached.","code":"limit_reached","status":{"tier":"free","limit":1,"used":1,"remaining":0,"resets_at":"2026-09-20T16:17:12.162258+00:00"}}"#
        XCTAssertEqual(FeedbackParser.outcome(status: 429, body: body(json)),
                       .limitReached(FeedbackQuota(limit: 1, used: 1, remaining: 0, resetsAt: "2026-09-20T16:17:12.162258+00:00")))
    }

    func testOtherFailuresAreToldApart() {
        XCTAssertEqual(FeedbackParser.outcome(status: 502, body: body(#"{"error":"Gemini request failed"}"#)), .busy)
        XCTAssertEqual(FeedbackParser.outcome(status: 500, body: body(#"{"error":"Unexpected server error"}"#)), .failed)
        XCTAssertEqual(FeedbackParser.outcome(status: 200, body: body(#"{"feedback":"  "}"#)), .failed)
        XCTAssertEqual(FeedbackParser.outcome(status: 200, body: body("not json")), .failed)
        XCTAssertEqual(FeedbackParser.outcome(status: 429, body: body(#"{"error":"slow down"}"#)), .failed)
    }
}
