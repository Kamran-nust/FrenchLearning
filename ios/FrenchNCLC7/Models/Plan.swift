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

/// Grammar, Kwiziq, TV5 and Writing all share this shape (`l` is TV5's level badge).
private struct TextDayRaw: Codable {
    let d: Int
    let w: Int
    let x: String
    let l: String?
}

/// What one day of one section shows.
struct DayContent: Identifiable, Equatable {
    let day: Int
    let week: Int
    let badge: String?
    let text: String
    let cards: [AnkiCard]
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
            DayContent(day: $0.d, week: $0.w, badge: $0.l, text: $0.x, cards: [])
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
