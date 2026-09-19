import Foundation

/// An extra lesson link shown on one day, in addition to the plan's own chips.
struct ExtraLink: Equatable {
    let label: String
    let url: String
}

/// Direct lesson links for Kwiziq / TV5MONDE (premium and super only; the database only hands them to those tiers).
///  - `links`: chip text to the real lesson page, replacing that chip's Google search;
///  - `extras`: day number to extra links for that day.
/// Free accounts never ask for these and simply get `.empty`, so every chip stays a Google search.
struct LessonLinks: Equatable {
    var links: [String: String] = [:]
    var extras: [Int: [ExtraLink]] = [:]

    static let empty = LessonLinks()
}

enum LessonLinkLogic {
    /// Only web (https) addresses are ever opened.
    static func isSafe(_ url: String) -> Bool { url.hasPrefix("https://") }

    private static func rows(_ body: Data?) -> [[String: Any]]? {
        guard let body else { return nil }
        return (try? JSONSerialization.jsonObject(with: body)) as? [[String: Any]]
    }

    /// Reads the two replies (chip links, extra links). A reply that is missing or unreadable counts as
    /// empty, so a problem with one never breaks the other (same as the web app).
    static func parse(chipRows: Data?, extraRows: Data?) -> LessonLinks {
        var links: [String: String] = [:]
        for row in rows(chipRows) ?? [] {
            if let chip = row["chip"] as? String, let url = row["url"] as? String, isSafe(url) { links[chip] = url }
        }
        // the database sorts extras by "sort"; keep that order per day
        var found: [(day: Int, sort: Int, link: ExtraLink)] = []
        for row in rows(extraRows) ?? [] {
            guard let day = (row["day"] as? NSNumber)?.intValue,
                  let label = row["label"] as? String,
                  let url = row["url"] as? String, isSafe(url) else { continue }
            let sort = (row["sort"] as? NSNumber)?.intValue ?? 0
            found.append((day, sort, ExtraLink(label: label, url: url)))
        }
        var extras: [Int: [ExtraLink]] = [:]
        // a stable sort by "sort" (indices break ties so equal numbers keep their order)
        let ordered = found.enumerated().sorted { ($0.element.sort, $0.offset) < ($1.element.sort, $1.offset) }.map { $0.element }
        for item in ordered { extras[item.day, default: []].append(item.link) }
        return LessonLinks(links: links, extras: extras)
    }

    /// True if this chip has a direct lesson page.
    static func hasDirect(_ chip: String, _ links: LessonLinks) -> Bool {
        guard let url = links.links[chip] else { return false }
        return isSafe(url)
    }

    /// Where a chip goes: its real lesson page if there is one, otherwise a Google search (as for free accounts).
    static func href(_ section: PlanSection, _ chip: String, _ links: LessonLinks) -> URL? {
        if let url = links.links[chip], isSafe(url) { return URL(string: url) }
        return LessonChips.searchURL(section, chip)
    }

    static func extrasFor(_ day: Int, _ links: LessonLinks) -> [ExtraLink] { links.extras[day] ?? [] }

    /// The lesson_links module name for a section ("kwiziq" or "tv5"); nil for sections without lesson links.
    static func moduleFor(_ section: PlanSection) -> String? {
        switch section {
        case .kwiziq: return "kwiziq"
        case .tv5: return "tv5"
        default: return nil
        }
    }
}
