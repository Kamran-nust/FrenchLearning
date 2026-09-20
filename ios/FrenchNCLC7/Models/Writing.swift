import Foundation

/// What is saved for one day of writing: the text, and the AI feedback once it has been asked for.
/// A missing field is left out of the saved JSON (as the web app does).
struct WritingEntry: Codable, Equatable {
    var text: String?
    var feedback: String?

    init(text: String? = nil, feedback: String? = nil) {
        self.text = text
        self.feedback = feedback
    }
}

/// Writing rules that match the web app: word target, word count, the saved-entries format
/// (a JSON object keyed by day number, the same as the web app so entries are shared).
enum WritingLogic {
    /// The most characters a single day's draft can hold. Matches MAX_INPUT_CHARS in the writing-feedback
    /// function (so you can't type more than you can submit) and keeps writing-entries a bounded size.
    static let maxDraftChars = 4000

    /// "Write a 60-word paragraph" gives 60; nil if the task doesn't name a length.
    static func extractWordTarget(_ task: String) -> Int? {
        guard let regex = try? NSRegularExpression(pattern: "(\\d+)[\\s-]*words?\\b", options: [.caseInsensitive]),
              let match = regex.firstMatch(in: task, range: NSRange(task.startIndex..., in: task)),
              let range = Range(match.range(at: 1), in: task) else { return nil }
        return Int(task[range])
    }

    static func countWords(_ text: String) -> Int {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return 0 }
        return trimmed.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.count
    }

    /// "1h 5m" / "12m" (never less than a minute), for the "next feedback available in" line.
    static func formatWait(_ seconds: TimeInterval) -> String {
        let totalMinutes = max(1, Int((seconds / 60).rounded(.up)))
        let h = totalMinutes / 60
        let m = totalMinutes % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    static func encodeEntries(_ entries: [Int: WritingEntry]) -> String {
        let keyed = Dictionary(uniqueKeysWithValues: entries.map { (String($0.key), $0.value) })
        guard let data = try? JSONEncoder().encode(keyed), let text = String(data: data, encoding: .utf8) else { return "{}" }
        return text
    }

    /// nil if the saved text can't be read (which is different from nothing being saved).
    static func decodeEntries(_ text: String) -> [Int: WritingEntry]? {
        guard let data = text.data(using: .utf8),
              let keyed = try? JSONDecoder().decode([String: WritingEntry].self, from: data) else { return nil }
        var result: [Int: WritingEntry] = [:]
        for (key, value) in keyed {
            if let day = Int(key) { result[day] = value }
        }
        return result
    }
}

/// The person's AI feedback allowance. `limit` and `remaining` are nil when unlimited.
struct FeedbackQuota: Equatable {
    let limit: Int?
    let used: Int
    let remaining: Int?
    let resetsAt: String?

    /// When the next slot frees up, if the allowance is used up.
    func resetDate() -> Date? {
        guard let text = resetsAt else { return nil }
        // The server sends microseconds ("...53.064937+00:00"); read the whole seconds, then add the fraction back.
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

    /// True when the allowance is used up and the next slot hasn't freed up yet.
    func limitReached(now: Date = Date()) -> Bool {
        guard limit != nil, remaining == 0, let resets = resetDate() else { return false }
        return resets > now
    }

    func secondsUntilReset(now: Date = Date()) -> TimeInterval {
        (resetDate() ?? now).timeIntervalSince(now)
    }
}

/// How a request for AI feedback ended.
enum FeedbackOutcome: Equatable {
    case success(String, FeedbackQuota?)
    /// Today's allowance is used up.
    case limitReached(FeedbackQuota?)
    /// The AI service is rate-limiting; nothing was used up.
    case busy
    case failed
}

enum FeedbackParser {
    static func quota(_ value: Any?) -> FeedbackQuota? {
        guard let obj = value as? [String: Any] else { return nil }
        func int(_ key: String) -> Int? { (obj[key] as? NSNumber)?.intValue }
        return FeedbackQuota(limit: int("limit"), used: int("used") ?? 0, remaining: int("remaining"),
                             resetsAt: obj["resets_at"] as? String)
    }

    /// Turns the writing-feedback function's reply into one of the outcomes above.
    static func outcome(status: Int, body: Data) -> FeedbackOutcome {
        let obj = (try? JSONSerialization.jsonObject(with: body)) as? [String: Any] ?? [:]
        if status == 429 && (obj["code"] as? String) == "limit_reached" {
            return .limitReached(quota(obj["status"]))
        }
        if status == 502 { return .busy }
        if (200...299).contains(status) {
            guard let text = obj["feedback"] as? String,
                  !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return .failed }
            return .success(text, quota(obj["quota"]))
        }
        return .failed
    }
}
