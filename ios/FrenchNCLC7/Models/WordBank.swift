import Foundation

/// One row of the person's Word Bank (the `word_bank_words` table).
struct WordBankWord: Codable, Equatable, Identifiable {
    let id: String
    var french: String
    var english: String
    var note: String?
    /// Set for words that came from the starter list; nil for words the person added.
    let starter_id: Int?
    var hidden: Bool
    let added_day: Int
    let created_at: String

    init(id: String, french: String, english: String, note: String? = nil, starter_id: Int? = nil,
         hidden: Bool = false, added_day: Int = 1, created_at: String = "") {
        self.id = id
        self.french = french
        self.english = english
        self.note = note
        self.starter_id = starter_id
        self.hidden = hidden
        self.added_day = added_day
        self.created_at = created_at
    }

    // Tolerant of columns the app doesn't use (user_id) and of missing optional values.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        french = try c.decode(String.self, forKey: .french)
        english = try c.decode(String.self, forKey: .english)
        note = try c.decodeIfPresent(String.self, forKey: .note)
        starter_id = try c.decodeIfPresent(Int.self, forKey: .starter_id)
        hidden = try c.decodeIfPresent(Bool.self, forKey: .hidden) ?? false
        added_day = try c.decodeIfPresent(Int.self, forKey: .added_day) ?? 1
        created_at = try c.decodeIfPresent(String.self, forKey: .created_at) ?? ""
    }

    enum CodingKeys: String, CodingKey {
        case id, french, english, note, starter_id, hidden, added_day, created_at
    }
}

/// How the review slots of a session are shared between the plan's words and Word Bank words.
struct ReviewSplit: Equatable {
    let builtin: Int
    let custom: Int
}

/// The Word Bank rules, the same as the web app (`frontend/src/shared/wordBank.js`).
enum WordBankLogic {
    /// Premium may add up to this many of their own words; starter words never count.
    static let premiumOwnLimit = 500
    /// Super has no limit in practice; the ceiling only stops a runaway paste filling the database.
    static let superOwnCeiling = 20000

    static let maxFrench = 200
    static let maxEnglish = 200
    static let maxNote = 300

    static func ownLimit(_ tier: Tier) -> Int {
        switch tier {
        case .free: return 0
        case .premium: return premiumOwnLimit
        case .superUser: return superOwnCeiling
        }
    }

    static func isOwn(_ w: WordBankWord) -> Bool { w.starter_id == nil }

    static func ownCount(_ words: [WordBankWord]) -> Int { words.filter { isOwn($0) }.count }

    static func hasRoom(_ tier: Tier, _ words: [WordBankWord]) -> Bool { ownCount(words) < ownLimit(tier) }

    struct Clean: Equatable {
        let french: String
        let english: String
        let note: String?
    }

    private static func tidy(_ s: String) -> String {
        s.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
    }

    /// Collapses stray spaces so "  le   pain " and "le pain" are the same word.
    static func clean(french: String, english: String, note: String) -> Clean {
        let n = tidy(note)
        return Clean(french: tidy(french), english: tidy(english), note: n.isEmpty ? nil : n)
    }

    /// A message to show, or nil if the word can be saved.
    static func validate(french: String, english: String, note: String) -> String? {
        let w = clean(french: french, english: english, note: note)
        if w.french.isEmpty { return "Enter the French word." }
        if w.english.isEmpty { return "Enter the English meaning." }
        if w.french.count > maxFrench || w.english.count > maxEnglish { return "That's too long. Keep each side under 200 characters." }
        if (w.note?.count ?? 0) > maxNote { return "The note is too long. Keep it under 300 characters." }
        return nil
    }

    static func isDuplicate(_ words: [WordBankWord], french: String, english: String, ignoring ignoreId: String? = nil) -> Bool {
        let w = clean(french: french, english: english, note: "")
        return words.contains {
            !$0.hidden && $0.id != ignoreId
                && $0.french.caseInsensitiveCompare(w.french) == .orderedSame
                && $0.english.caseInsensitiveCompare(w.english) == .orderedSame
        }
    }

    /// Searches both languages and the note.
    static func filter(_ words: [WordBankWord], query: String) -> [WordBankWord] {
        let q = query.trimmingCharacters(in: .whitespaces).lowercased()
        if q.isEmpty { return words }
        return words.filter {
            $0.french.lowercased().contains(q) || $0.english.lowercased().contains(q) || ($0.note ?? "").lowercased().contains(q)
        }
    }

    /// The person's own words first (newest first), then the starter words in their saved order.
    static func sortForDisplay(_ words: [WordBankWord]) -> [WordBankWord] {
        words.filter { isOwn($0) }.sorted { $0.created_at > $1.created_at } + words.filter { !isOwn($0) }
    }

    /// Word Bank rows as Anki cards. Hidden words are left out; the "wb:" id can never clash with a plan card.
    static func toCards(_ words: [WordBankWord]) -> [AnkiLogic.Pooled] {
        words.filter { !$0.hidden }.map { (card: AnkiCard(i: "wb:" + $0.id, f: $0.french, e: $0.english), day: $0.added_day) }
    }

    static func isWordBankCard(_ cardId: String) -> Bool { cardId.hasPrefix("wb:") }

    /// Splits a session's review slots between plan words and Word Bank words. Word Bank gets about a quarter (at
    /// least one) so a long list can't crowd out the plan, but fills the gap when there are too few plan words to
    /// review yet (for example on day 1).
    static func splitReviewSlots(target: Int, builtin builtinCount: Int, custom customCount: Int) -> ReviewSplit {
        if customCount <= 0 || target <= 0 { return ReviewSplit(builtin: max(0, min(target, builtinCount)), custom: 0) }
        let quota = max(1, Int((Double(target) / 4.0).rounded(.up)))
        let custom = min(customCount, max(quota, target - builtinCount))
        let builtin = max(0, min(builtinCount, target - custom))
        return ReviewSplit(builtin: builtin, custom: custom)
    }

    /// The rows from `word_bank_list` / an insert, or nil if the reply can't be read.
    static func parseList(_ data: Data) -> [WordBankWord]? {
        try? JSONDecoder().decode([WordBankWord].self, from: data)
    }
}
