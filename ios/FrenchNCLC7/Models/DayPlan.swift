import Foundation

/// One section of the day-plan PDF: a title, and either flashcards, a paragraph, or a list.
struct PlanPdfSection: Equatable {
    let title: String
    /// Small text on the right of the heading, e.g. "12 new cards".
    var note: String? = nil
    var cards: [AnkiCard] = []
    var text: String? = nil
    var items: [String] = []
}

/// Everything that goes in the PDF for one day (kept apart from drawing, so it can be tested).
struct DayPlanContent: Equatable {
    let day: Int
    let week: Int
    let sections: [PlanPdfSection]
}

/// The download allowance: whether another PDF may be downloaded now, and when the next slot frees up.
struct PdfQuota: Equatable {
    let allowed: Bool
    let resetsAt: String?

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

    func secondsUntilReset(now: Date = Date()) -> TimeInterval {
        (resetDate() ?? now).timeIntervalSince(now)
    }
}

/// The reply to asking for a download: `ok` is true when a download was reserved (`id` is the reservation).
struct PdfClaim: Equatable {
    let ok: Bool
    let id: Int?
    let status: PdfQuota?
}

enum DayPlanLogic {
    private static func splitRaw(_ text: String) -> [String] {
        text.split(separator: ";", omittingEmptySubsequences: true)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    /// The day's plan across the five sections, as plain text (no links), matching the web app's PDF:
    /// Anki cards, the grammar task, Kwiziq lessons, TV5MONDE (its level, then the lessons), and the writing task.
    static func build(anki: DayContent, grammar: DayContent, kwiziq: DayContent, tv5: DayContent, writing: DayContent) -> DayPlanContent {
        DayPlanContent(day: anki.day, week: anki.week, sections: [
            PlanPdfSection(title: "Anki", note: "\(anki.cards.count) new cards", cards: anki.cards),
            PlanPdfSection(title: "Grammar book", text: grammar.text),
            PlanPdfSection(title: "Kwiziq", items: splitRaw(kwiziq.text)),
            PlanPdfSection(title: "TV5MONDE", items: (tv5.badge.map { [$0] } ?? []) + splitRaw(tv5.text)),
            PlanPdfSection(title: "Writing", text: writing.text),
        ])
    }

    static func fileName(_ day: Int) -> String { "French-NCLC7-Day-\(day).pdf" }

    /// "Available again in 5h 12m"
    static func waitText(_ quota: PdfQuota, now: Date = Date()) -> String {
        "Available again in " + WritingLogic.formatWait(quota.secondsUntilReset(now: now))
    }

    private static func quota(from value: Any?) -> PdfQuota? {
        guard let obj = value as? [String: Any], let allowed = obj["allowed"] as? Bool else { return nil }
        return PdfQuota(allowed: allowed, resetsAt: obj["resets_at"] as? String)
    }

    /// Reads the reply to "where do I stand" (nil if it can't be read).
    static func parseQuota(_ body: Data) -> PdfQuota? {
        quota(from: try? JSONSerialization.jsonObject(with: body))
    }

    /// Reads the reply to "reserve a download". An unreadable reply counts as not allowed (never as allowed).
    static func parseClaim(_ body: Data) -> PdfClaim {
        guard let obj = (try? JSONSerialization.jsonObject(with: body)) as? [String: Any] else {
            return PdfClaim(ok: false, id: nil, status: nil)
        }
        let ok = (obj["ok"] as? Bool) == true
        return PdfClaim(ok: ok, id: (obj["id"] as? NSNumber)?.intValue, status: quota(from: obj["status"]))
    }
}
