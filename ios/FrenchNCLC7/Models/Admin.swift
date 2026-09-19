import Foundation

/// One row of the admin user list (the database only returns these to super users).
struct AdminUser: Equatable {
    let userId: String
    let email: String?
    let username: String?
    let tier: Tier
    let createdAt: String?
    let lastSignInAt: String?
    let feedbackUsed24h: Int

    /// What the list shows as the name: the username if there is one, otherwise the email.
    var displayName: String { username ?? email ?? userId }
}

extension Tier {
    /// Lowest to highest.
    static let ordered: [Tier] = [.free, .premium, .superUser]
}

/// Dates as the server sends them, e.g. "2026-09-19T15:03:22.123456+00:00".
enum ServerDate {
    static func parse(_ text: String?) -> Date? {
        guard let text else { return nil }
        // The server sends microseconds; read the whole seconds, then add the fraction back.
        var whole = text
        var fraction = 0.0
        if let dot = text.firstIndex(of: "."),
           let end = text[dot...].firstIndex(where: { $0 == "+" || $0 == "-" || $0 == "Z" }) {
            fraction = Double("0" + String(text[dot..<end])) ?? 0
            whole = String(text[..<dot]) + String(text[end...])
        }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: whole).map { $0.addingTimeInterval(fraction) }
    }
}

/// The admin page's rules, matching the web app; kept apart from the screen so they can be tested.
enum AdminLogic {
    /// Reads the reply of the user-list function; nil if it can't be read (an empty list is a valid reply).
    static func parseUsers(_ body: Data) -> [AdminUser]? {
        guard let rows = (try? JSONSerialization.jsonObject(with: body)) as? [Any] else { return nil }
        var out: [AdminUser] = []
        for case let row as [String: Any] in rows {
            guard let id = row["user_id"] as? String else { continue }
            let username = (row["username"] as? String).flatMap { $0.isEmpty ? nil : $0 }
            out.append(AdminUser(
                userId: id,
                email: row["email"] as? String,
                username: username,
                tier: Tier.from(row["tier"] as? String),
                createdAt: row["created_at"] as? String,
                lastSignInAt: row["last_sign_in_at"] as? String,
                feedbackUsed24h: (row["feedback_used_24h"] as? NSNumber)?.intValue ?? 0
            ))
        }
        return out
    }

    /// People whose email or username contains the search text (ignoring case); everyone when it is blank.
    static func filter(_ users: [AdminUser], query: String) -> [AdminUser] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if q.isEmpty { return users }
        return users.filter { ($0.email ?? "").lowercased().contains(q) || ($0.username ?? "").lowercased().contains(q) }
    }

    static func counts(_ users: [AdminUser]) -> [Tier: Int] {
        var result: [Tier: Int] = [:]
        for t in Tier.ordered { result[t] = users.filter { $0.tier == t }.count }
        return result
    }

    /// "just now", "5m ago", "3h ago", "2d ago", or "never".
    static func timeAgo(_ iso: String?, now: Date = Date()) -> String {
        guard let then = ServerDate.parse(iso) else { return "never" }
        let minutes = max(0, Int(((now.timeIntervalSince(then)) / 60 + 0.5).rounded(.down)))
        if minutes < 2 { return "just now" }
        if minutes < 60 { return "\(minutes)m ago" }
        let hours = Int((Double(minutes) / 60 + 0.5).rounded(.down))
        if hours < 24 { return "\(hours)h ago" }
        return "\(Int((Double(hours) / 24 + 0.5).rounded(.down)))d ago"
    }

    /// "Sep 19, 2026", or "never".
    static func formatDate(_ iso: String?, timeZone: TimeZone = .current, locale: Locale = .current) -> String {
        guard let date = ServerDate.parse(iso) else { return "never" }
        let formatter = DateFormatter()
        formatter.locale = locale
        formatter.timeZone = timeZone
        formatter.dateFormat = "MMM d, yyyy"
        return formatter.string(from: date)
    }

    /// "Joined Sep 19, 2026 · Last sign-in 5m ago · 2 AI feedbacks (24h)"
    static func activityLine(_ u: AdminUser, now: Date = Date(), timeZone: TimeZone = .current, locale: Locale = .current) -> String {
        var line = "Joined \(formatDate(u.createdAt, timeZone: timeZone, locale: locale)) · Last sign-in \(timeAgo(u.lastSignInAt, now: now))"
        if u.feedbackUsed24h > 0 {
            line += " · \(u.feedbackUsed24h) AI feedback" + (u.feedbackUsed24h == 1 ? "" : "s") + " (24h)"
        }
        return line
    }

    /// Making someone super is the one change that asks first (super users can change everyone's tier).
    static func needsConfirmation(_ newTier: Tier) -> Bool { newTier == .superUser }

    static func confirmText(_ u: AdminUser) -> String {
        "Make \(u.email ?? "this user") a super user? Super users can change everyone's tier."
    }

    /// Your own row is locked, so you can't demote yourself by accident.
    static func isLocked(_ u: AdminUser, myId: String?, saving: Bool) -> Bool { u.userId == myId || saving }
}
