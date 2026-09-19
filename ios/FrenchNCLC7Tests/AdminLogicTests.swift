import XCTest
@testable import FrenchNCLC7

final class AdminLogicTests: XCTestCase {
    private let now = ISO8601DateFormatter().date(from: "2026-09-19T12:00:00Z")!
    private let utc = TimeZone(identifier: "UTC")!
    private let us = Locale(identifier: "en_US_POSIX")

    private func user(_ id: String, _ email: String?, _ username: String?, tier: Tier = .free, fb: Int = 0) -> AdminUser {
        AdminUser(userId: id, email: email, username: username, tier: tier, createdAt: "2026-01-05T10:00:00+00:00",
                  lastSignInAt: "2026-09-19T11:55:00+00:00", feedbackUsed24h: fb)
    }

    private var people: [AdminUser] {
        [user("1", "kamran90.fastian@gmail.com", "Kamran", tier: .superUser),
         user("2", "kamran_nust@yahoo.com", "Kamran1", tier: .premium, fb: 2),
         user("3", "kami90@yorku.ca", "Kami"),
         user("4", "noname@example.com", nil)]
    }

    func testTheUserListReplyIsRead() {
        let body = #"""
        [
          {"user_id":"a1","email":"a@x.com","username":"alice","tier":"premium","created_at":"2026-01-05T10:00:00.123456+00:00","last_sign_in_at":null,"feedback_used_24h":3},
          {"user_id":"b2","email":"b@x.com","username":null,"tier":"free","created_at":"2026-02-01T10:00:00+00:00","last_sign_in_at":"2026-09-19T11:58:00+00:00","feedback_used_24h":0}
        ]
        """#
        let users = AdminLogic.parseUsers(Data(body.utf8))
        XCTAssertEqual(users?.count, 2)
        XCTAssertEqual(users?[0], AdminUser(userId: "a1", email: "a@x.com", username: "alice", tier: .premium,
                                            createdAt: "2026-01-05T10:00:00.123456+00:00", lastSignInAt: nil, feedbackUsed24h: 3))
        XCTAssertNil(users?[1].username)
        XCTAssertEqual(users?[1].displayName, "b@x.com")
        XCTAssertEqual(users?[0].displayName, "alice")
    }

    func testOddReplyShapesAreHandledSafely() {
        XCTAssertEqual(AdminLogic.parseUsers(Data("[]".utf8)), [])
        XCTAssertNil(AdminLogic.parseUsers(Data("not json".utf8)))
        XCTAssertNil(AdminLogic.parseUsers(Data(#"{"message":"Only super users can list users."}"#.utf8)))
        // a row with no id is skipped; an unknown or missing tier shows as free (never as more than free)
        let users = AdminLogic.parseUsers(Data(#"[{"email":"x@x.com"},{"user_id":"u1","tier":"gold"},{"user_id":"u2"}]"#.utf8))
        XCTAssertEqual(users?.map { $0.userId }, ["u1", "u2"])
        XCTAssertTrue(users?.allSatisfy { $0.tier == .free } == true)
    }

    func testSearchMatchesEmailOrUsernameIgnoringCase() {
        XCTAssertEqual(AdminLogic.filter(people, query: "kamran").map { $0.userId }, ["1", "2"])
        XCTAssertEqual(AdminLogic.filter(people, query: "  NUST ").map { $0.userId }, ["2"])
        XCTAssertEqual(AdminLogic.filter(people, query: "yorku").map { $0.userId }, ["3"])
        XCTAssertEqual(AdminLogic.filter(people, query: "noname").map { $0.userId }, ["4"])
        XCTAssertEqual(AdminLogic.filter(people, query: "   "), people)
        XCTAssertTrue(AdminLogic.filter(people, query: "zzz").isEmpty)
    }

    func testTiersAreCounted() {
        XCTAssertEqual(AdminLogic.counts(people), [.free: 2, .premium: 1, .superUser: 1])
        XCTAssertEqual(AdminLogic.counts([]), [.free: 0, .premium: 0, .superUser: 0])
    }

    func testTimeAgoReadsLikeTheWebApp() {
        func ago(_ iso: String?) -> String { AdminLogic.timeAgo(iso, now: now) }
        XCTAssertEqual(ago(nil), "never")
        XCTAssertEqual(ago("garbage"), "never")
        XCTAssertEqual(ago("2026-09-19T11:59:40+00:00"), "just now")
        XCTAssertEqual(ago("2026-09-19T11:59:00+00:00"), "just now")   // 1 minute
        XCTAssertEqual(ago("2026-09-19T11:58:00+00:00"), "2m ago")
        XCTAssertEqual(ago("2026-09-19T11:01:00+00:00"), "59m ago")
        XCTAssertEqual(ago("2026-09-19T10:30:00+00:00"), "2h ago")     // 90 minutes rounds to 2 hours
        XCTAssertEqual(ago("2026-09-18T13:00:00+00:00"), "23h ago")
        XCTAssertEqual(ago("2026-09-18T11:00:00+00:00"), "1d ago")
        XCTAssertEqual(ago("2026-09-09T12:00:00+00:00"), "10d ago")
        XCTAssertEqual(ago("2026-09-19T12:05:00+00:00"), "just now")   // a slightly-fast clock never shows a negative time
    }

    func testDatesAreShownInTheReadersLocalTime() {
        XCTAssertEqual(AdminLogic.formatDate("2026-09-19T15:00:00+00:00", timeZone: utc, locale: us), "Sep 19, 2026")
        XCTAssertEqual(AdminLogic.formatDate("2026-09-19T23:30:00-05:00", timeZone: utc, locale: us), "Sep 20, 2026")
        XCTAssertEqual(AdminLogic.formatDate(nil, timeZone: utc, locale: us), "never")
    }

    func testTheActivityLineMatchesTheWebApp() {
        XCTAssertEqual(AdminLogic.activityLine(people[1], now: now, timeZone: utc, locale: us),
                       "Joined Jan 5, 2026 · Last sign-in 5m ago · 2 AI feedbacks (24h)")
        XCTAssertEqual(AdminLogic.activityLine(people[2], now: now, timeZone: utc, locale: us), "Joined Jan 5, 2026 · Last sign-in 5m ago")
        XCTAssertTrue(AdminLogic.activityLine(user("9", "a@b.c", nil, fb: 1), now: now, timeZone: utc, locale: us).hasSuffix("1 AI feedback (24h)"))
    }

    func testOnlyMakingSomeoneSuperAsksFirst() {
        XCTAssertTrue(AdminLogic.needsConfirmation(.superUser))
        XCTAssertFalse(AdminLogic.needsConfirmation(.premium))
        XCTAssertFalse(AdminLogic.needsConfirmation(.free))
        XCTAssertEqual(AdminLogic.confirmText(people[2]), "Make kami90@yorku.ca a super user? Super users can change everyone's tier.")
        XCTAssertEqual(AdminLogic.confirmText(user("9", nil, nil)), "Make this user a super user? Super users can change everyone's tier.")
    }

    func testYourOwnRowAndSavingRowsAreLocked() {
        XCTAssertTrue(AdminLogic.isLocked(people[0], myId: "1", saving: false))
        XCTAssertFalse(AdminLogic.isLocked(people[1], myId: "1", saving: false))
        XCTAssertTrue(AdminLogic.isLocked(people[1], myId: "1", saving: true))
        XCTAssertFalse(AdminLogic.isLocked(people[1], myId: nil, saving: false))
    }
}
