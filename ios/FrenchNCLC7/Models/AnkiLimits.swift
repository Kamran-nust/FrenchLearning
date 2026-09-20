import Foundation

/// What is saved as `anki-daily`: how many cards were seen on which day (the same shape the web app saves).
struct DailyCount: Codable, Equatable {
    var date: String
    var seen: Int
}

/// Daily limits for the Anki vocabulary section and Super's bigger day - the same rules as the web app
/// (`frontend/src/shared/ankiLimits.js`).
///
/// The counter lives on the device with the rest of the saved progress, so a determined person could reset it;
/// making it server-side is a later change (see DESIGN_DOC.md, "Later: server-side Anki limits").
enum AnkiLimits {
    static let freeDaily = 30
    static let premiumDaily = 200

    /// Super's day (new words plus reviews) rises steadily from `superDayMin` to `superDayMax` across the plan.
    static let superDayMin = 25
    static let superDayMax = 50

    /// Words (cards) a person can see per day; nil means no limit.
    static func dailyLimit(_ tier: Tier) -> Int? {
        switch tier {
        case .free: return freeDaily
        case .premium: return premiumDaily
        case .superUser: return nil
        }
    }

    /// Cards in a Super user's day once `completedDays` are done (25 at 0, 50 at 300 or more).
    static func superDayTotal(_ completedDays: Int) -> Int {
        let f = min(1.0, max(0.0, Double(completedDays) / 300.0))
        return Int((Double(superDayMin) + Double(superDayMax - superDayMin) * f + 0.5).rounded(.down))
    }

    /// Cards seen today, from the saved text. A count saved on another day (or unreadable) is 0.
    static func todaysCount(_ saved: String?, today: String) -> Int {
        guard let saved, let data = saved.data(using: .utf8),
              let c = try? JSONDecoder().decode(DailyCount.self, from: data) else { return 0 }
        return c.date == today && c.seen > 0 ? c.seen : 0
    }

    static func encodeCount(date: String, seen: Int) -> String {
        guard let data = try? JSONEncoder().encode(DailyCount(date: date, seen: seen)),
              let text = String(data: data, encoding: .utf8) else { return "{}" }
        return text
    }

    /// Cards still allowed today, or nil if there is no limit.
    static func remainingToday(_ tier: Tier, seen: Int) -> Int? {
        dailyLimit(tier).map { max(0, $0 - seen) }
    }

    static func limitReached(_ tier: Tier, seen: Int) -> Bool {
        (remainingToday(tier, seen: seen) ?? 1) <= 0
    }

    /// The most cards a new session may have. A day's own session is only held to the daily limit itself, so the
    /// day can always be completed; extra practice gets only what is left of today's allowance. nil = no cap.
    static func sessionCap(_ tier: Tier, practice: Bool, seen: Int) -> Int? {
        guard let limit = dailyLimit(tier) else { return nil }
        return practice ? max(0, limit - seen) : limit
    }
}
