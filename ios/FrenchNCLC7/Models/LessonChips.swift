import Foundation

/// How Kwiziq and TV5MONDE days are broken into lesson "chips" (the same rules as the web app),
/// and the Google-search link each chip opens.
enum LessonChips {
    // Many TV5 days start with the level name ("Première classe: ..."); the level is shown as a badge instead.
    private static let levelPrefix = "^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\\s*:\\s*"

    private static func split(_ text: String) -> [String] {
        text.split(separator: ";", omittingEmptySubsequences: true)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    /// The lesson chips for a day; empty for sections that don't use chips.
    static func chips(_ section: PlanSection, _ day: DayContent) -> [String] {
        switch section {
        case .kwiziq:
            return split(day.text)
        case .tv5:
            return split(day.text.replacingOccurrences(of: levelPrefix, with: "", options: .regularExpression))
        default:
            return []
        }
    }

    /// The main text shown on the day card.
    static func body(_ section: PlanSection, _ day: DayContent) -> String {
        guard section == .tv5 else { return day.text }
        let list = chips(section, day)
        return list.isEmpty ? day.text : list.joined(separator: " · ")
    }

    static func searchURL(_ section: PlanSection, _ chip: String) -> URL? {
        let site = section == .tv5 ? "site:tv5monde.com " : "site:french.kwiziq.com "
        // Exactly the characters JavaScript's encodeURIComponent leaves alone (accented letters are encoded).
        let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.!~*'()")
        guard let query = (site + chip).addingPercentEncoding(withAllowedCharacters: allowed) else { return nil }
        return URL(string: "https://www.google.com/search?q=" + query)
    }
}
