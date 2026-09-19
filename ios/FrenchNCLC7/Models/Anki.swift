import Foundation

/// French shown first (and spoken) or English shown first.
enum Direction: Equatable {
    case fe, ef
}

/// One flashcard in today's queue.
struct AnkiItem: Equatable {
    let cardId: String
    let french: String
    let english: String
    let dir: Direction
    /// The curriculum day this word was first taught.
    let sourceDay: Int
    /// Unique within the session.
    let key: String
}

/// Today's queue: the day's new words first, then review words from earlier days.
struct AnkiSession: Equatable {
    let dayNumber: Int
    let items: [AnkiItem]
    let reviewCount: Int
}

/// Per-word counters, saved exactly as the web app saves them (`card-stats`).
struct CardStat: Codable, Equatable {
    var times_seen: Int = 0
    var times_marked_hard_total: Int = 0
    var last_seen_day: Int? = nil

    init(times_seen: Int = 0, times_marked_hard_total: Int = 0, last_seen_day: Int? = nil) {
        self.times_seen = times_seen
        self.times_marked_hard_total = times_marked_hard_total
        self.last_seen_day = last_seen_day
    }

    // Written by hand so a word that hasn't been seen is saved with null (as the web app does), not left out.
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(times_seen, forKey: .times_seen)
        try c.encode(times_marked_hard_total, forKey: .times_marked_hard_total)
        try c.encode(last_seen_day, forKey: .last_seen_day)
    }

    enum CodingKeys: String, CodingKey {
        case times_seen, times_marked_hard_total, last_seen_day
    }
}

/// The Anki rules, matching the web app (see DESIGN_DOC sections 4 and 5):
///  - new words: French to English, one card each;
///  - review words: earlier days' words, one card each in a random direction, picked at random with
///    words marked "hard" five times as likely; how many grows from about 5 up to about 40 as more days are done.
enum AnkiLogic {
    typealias Pooled = (card: AnkiCard, day: Int)

    /// How many review cards to add, given how many days are already completed.
    static func reviewTarget(_ completedCount: Int) -> Int {
        Int((5 + (35.0 / 300.0) * Double(completedCount) + 0.5).rounded(.down))
    }

    /// Picks `count` distinct cards at random; a hard card counts five times.
    static func weightedSample<G: RandomNumberGenerator>(_ pool: [Pooled], hard: Set<String>, count: Int, using generator: inout G) -> [Pooled] {
        var arr = pool.map { (item: $0, weight: hard.contains($0.card.i) ? 5 : 1) }
        var out: [Pooled] = []
        var n = 0
        while n < count && !arr.isEmpty {
            let total = arr.reduce(0) { $0 + $1.weight }
            var r = Double.random(in: 0..<1, using: &generator) * Double(total)
            var idx = 0
            while idx < arr.count {
                r -= Double(arr[idx].weight)
                if r <= 0 { break }
                idx += 1
            }
            idx = min(idx, arr.count - 1)
            out.append(arr[idx].item)
            arr.remove(at: idx)
            n += 1
        }
        return out
    }

    /// Builds the queue for `currentDay`; nil if that day doesn't exist.
    static func buildSession<G: RandomNumberGenerator>(days: [DayContent], currentDay: Int, completedCount: Int,
                                                       hard: Set<String>, using generator: inout G) -> AnkiSession? {
        guard let today = days.first(where: { $0.day == currentDay }) else { return nil }
        let newItems = today.cards.map {
            AnkiItem(cardId: $0.i, french: $0.f, english: $0.e, dir: .fe, sourceDay: today.day, key: "\($0.i)-new-\(today.day)")
        }
        var pool: [Pooled] = []
        for d in days where d.day < today.day {
            for card in d.cards { pool.append((card, d.day)) }
        }
        let reviewCount = min(reviewTarget(completedCount), pool.count)
        let picked = weightedSample(pool, hard: hard, count: reviewCount, using: &generator)
        var reviewItems: [AnkiItem] = []
        for (card, sourceDay) in picked {
            let dir: Direction = Double.random(in: 0..<1, using: &generator) < 0.5 ? .ef : .fe
            reviewItems.append(AnkiItem(cardId: card.i, french: card.f, english: card.e, dir: dir,
                                        sourceDay: sourceDay, key: "\(card.i)-rev-\(sourceDay)-\(today.day)"))
        }
        return AnkiSession(dayNumber: today.day, items: newItems + reviewItems, reviewCount: reviewCount)
    }

    static func buildSession(days: [DayContent], currentDay: Int, completedCount: Int, hard: Set<String>) -> AnkiSession? {
        var generator = SystemRandomNumberGenerator()
        return buildSession(days: days, currentDay: currentDay, completedCount: completedCount, hard: hard, using: &generator)
    }

    /// After a real (not practice) day: every card in the queue has been seen once more.
    static func markSeen(_ stats: [String: CardStat], _ session: AnkiSession) -> [String: CardStat] {
        var out = stats
        for w in session.items {
            var s = out[w.cardId] ?? CardStat()
            s.times_seen += 1
            s.last_seen_day = session.dayNumber
            out[w.cardId] = s
        }
        return out
    }

    static func markHard(_ stats: [String: CardStat], _ cardId: String) -> [String: CardStat] {
        var out = stats
        var s = out[cardId] ?? CardStat()
        s.times_marked_hard_total += 1
        out[cardId] = s
        return out
    }

    static func encodeStats(_ stats: [String: CardStat]) -> String {
        guard let data = try? JSONEncoder().encode(stats), let text = String(data: data, encoding: .utf8) else { return "{}" }
        return text
    }

    /// nil if the saved text can't be read (which is different from nothing being saved).
    static func decodeStats(_ text: String) -> [String: CardStat]? {
        guard let data = text.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode([String: CardStat].self, from: data)
    }

    static func encodeHard(_ hard: [String]) -> String {
        guard let data = try? JSONEncoder().encode(hard), let text = String(data: data, encoding: .utf8) else { return "[]" }
        return text
    }

    static func decodeHard(_ text: String) -> [String]? {
        guard let data = text.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode([String].self, from: data)
    }
}
