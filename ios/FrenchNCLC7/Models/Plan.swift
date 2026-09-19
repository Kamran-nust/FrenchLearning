import Foundation

let totalDays = 301

/// The five study sections. `storageKey` is where the web app saves that section's progress.
enum PlanSection: String, CaseIterable, Identifiable {
    case anki, grammar, kwiziq, tv5, writing

    var id: String { rawValue }

    var title: String {
        switch self {
        case .anki: return "Anki vocabulary"
        case .grammar: return "Grammar book"
        case .kwiziq: return "Kwiziq"
        case .tv5: return "TV5MONDE"
        case .writing: return "Writing"
        }
    }

    var tagline: String {
        switch self {
        case .anki: return "Daily flashcards, both directions"
        case .grammar: return "Grammaire Progressive du Français"
        case .kwiziq: return "Daily lesson links"
        case .tv5: return "Daily listening links"
        case .writing: return "Daily writing task"
        }
    }

    var storageKey: String {
        switch self {
        case .anki: return "progress"
        case .grammar: return "grammar-progress"
        case .kwiziq: return "kwiziq-progress"
        case .tv5: return "tv5-progress"
        case .writing: return "writing-progress"
        }
    }

    /// Name of the bundled plan file (see tools/export-plan-data.mjs).
    var file: String { rawValue }
}

struct AnkiCard: Codable, Hashable {
    let i: String
    let f: String
    let e: String
}

private struct AnkiDayRaw: Codable {
    let d: Int
    let w: Int
    let c: [AnkiCard]
}

/// One book reference on a Grammar day: which book, which chapters, and the chapter title (sometimes missing).
private struct GrammarEntryRaw: Codable {
    let b: String
    let c: [Int]?
    let t: String?
}

/// Grammar, Kwiziq, TV5 and Writing all share this shape (`l` is TV5's level badge, `e` is only on Grammar days).
private struct TextDayRaw: Codable {
    let d: Int
    let w: Int
    let x: String
    let l: String?
    let e: [GrammarEntryRaw]?
}

/// The chapters to open in one grammar book for a day (a day can name several books).
struct BookChapters: Equatable {
    let book: String
    let chapters: [Int]

    /// "A1-A2 ch. 1, 4"
    var label: String { "\(book) ch. " + chapters.map(String.init).joined(separator: ", ") }
}

enum GrammarBooks {
    /// Groups a day's chapters by book, keeping the order books first appear and every chapter in order (same as the web app).
    static func group(_ entries: [(book: String, chapters: [Int])]) -> [BookChapters] {
        var order: [String] = []
        var chapters: [String: [Int]] = [:]
        for entry in entries {
            if chapters[entry.book] == nil { order.append(entry.book) }
            chapters[entry.book, default: []].append(contentsOf: entry.chapters)
        }
        return order.map { BookChapters(book: $0, chapters: chapters[$0] ?? []) }
    }
}

/// What one day of one section shows.
struct DayContent: Identifiable, Equatable {
    let day: Int
    let week: Int
    let badge: String?
    let text: String
    let cards: [AnkiCard]
    /// The book chapters for the day (Grammar only).
    var chapters: [BookChapters] = []
    var id: Int { day }
}

/// Parses the exported plan files. Pure, so it is unit-tested.
enum PlanParser {
    static func anki(_ data: Data) throws -> [DayContent] {
        try JSONDecoder().decode([AnkiDayRaw].self, from: data).map {
            DayContent(day: $0.d, week: $0.w, badge: nil, text: "\($0.c.count) new cards", cards: $0.c)
        }
    }

    static func textDays(_ data: Data) throws -> [DayContent] {
        try JSONDecoder().decode([TextDayRaw].self, from: data).map {
            DayContent(day: $0.d, week: $0.w, badge: $0.l, text: $0.x, cards: [],
                       chapters: GrammarBooks.group(($0.e ?? []).map { (book: $0.b, chapters: $0.c ?? []) }))
        }
    }
}

/// Loads the plan JSON bundled in the app, once per section.
final class PlanRepository {
    private var cache: [PlanSection: [DayContent]] = [:]
    private let bundle: Bundle

    init(bundle: Bundle = .main) {
        self.bundle = bundle
    }

    func days(_ section: PlanSection) -> [DayContent] {
        if let cached = cache[section] { return cached }
        guard let url = bundle.url(forResource: section.file, withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return [] }
        let parsed = (section == .anki ? try? PlanParser.anki(data) : try? PlanParser.textDays(data)) ?? []
        cache[section] = parsed
        return parsed
    }
}
