import Foundation

/// One word marked "I got it wrong": card id, French, English (the same shape the web app saves).
struct MissedWord: Codable, Equatable {
    let i: String
    let f: String
    let e: String
}

/// What is saved as `anki-missed`: the day the words were missed on and the words, each once.
struct MissedList: Codable, Equatable {
    var day: Int? = nil
    var words: [MissedWord] = []

    init(day: Int? = nil, words: [MissedWord] = []) {
        self.day = day
        self.words = words
    }

    // Written by hand so an empty list is saved with "day": null (as the web app does), not left out.
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(day, forKey: .day)
        try c.encode(words, forKey: .words)
    }

    enum CodingKeys: String, CodingKey {
        case day, words
    }
}

/// Anki "I got it wrong" marks - the same rules as the web app (`frontend/src/shared/missedWords.js`).
///
/// While a round is running the marks live in memory. When the round finishes they are merged into the saved
/// list (each word once) and shown under the "Day N done" buttons. The list is saved to the account as
/// `anki-missed`, so it survives closing the app and is the same on every device, and it is cleared when the
/// person taps "Start next day" (or resets Anki).
enum MissedWords {
    static let key = "anki-missed"
    static let empty = MissedList()

    static func encode(_ list: MissedList) -> String {
        guard let data = try? JSONEncoder().encode(list), let text = String(data: data, encoding: .utf8) else {
            return #"{"day":null,"words":[]}"#
        }
        return text
    }

    /// The saved value, checked and tidied; anything unreadable counts as an empty list.
    static func decode(_ text: String?) -> MissedList {
        guard let text, let data = text.data(using: .utf8),
              let loose = try? JSONDecoder().decode(Loose.self, from: data), let items = loose.words else { return empty }
        var seen = Set<String>()
        var words: [MissedWord] = []
        for w in items.compactMap({ $0.word }) where !seen.contains(w.i) {
            seen.insert(w.i)
            words.append(w)
        }
        return MissedList(day: loose.day, words: words)
    }

    /// Marks or unmarks one card in the current round (kept in the order they were marked).
    static func toggle(_ round: [MissedWord], _ item: AnkiItem) -> [MissedWord] {
        if round.contains(where: { $0.i == item.cardId }) { return round.filter { $0.i != item.cardId } }
        return round + [MissedWord(i: item.cardId, f: item.french, e: item.english)]
    }

    /// The saved list plus this round's marks, each word once, in the order they were first marked.
    static func merge(_ words: [MissedWord], _ round: [MissedWord]) -> [MissedWord] {
        var have = Set(words.map(\.i))
        var out = words
        for w in round where !have.contains(w.i) {
            have.insert(w.i)
            out.append(w)
        }
        return out
    }

    /// The missed words that aren't flagged hard yet (what "Flag all as hard" would add).
    static func unflagged(_ words: [MissedWord], hard: [String]) -> [MissedWord] {
        let hardSet = Set(hard)
        return words.filter { !hardSet.contains($0.i) }
    }

    // Reading never fails on one bad entry or a wrong type: those are just skipped.
    private struct Loose: Decodable {
        let day: Int?
        let words: [LooseWord]?

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: MissedList.CodingKeys.self)
            day = try? c.decode(Int.self, forKey: .day)
            words = try? c.decode([LooseWord].self, forKey: .words)
        }
    }

    private struct LooseWord: Decodable {
        let word: MissedWord?

        init(from decoder: Decoder) {
            guard let c = try? decoder.container(keyedBy: Keys.self),
                  let i = try? c.decode(String.self, forKey: .i),
                  let f = try? c.decode(String.self, forKey: .f),
                  let e = try? c.decode(String.self, forKey: .e) else {
                word = nil
                return
            }
            word = MissedWord(i: i, f: f, e: e)
        }

        enum Keys: String, CodingKey {
            case i, f, e
        }
    }
}
