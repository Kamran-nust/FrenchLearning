import Foundation

enum PlanProgress {
    /// The `completed_days` list inside one section's saved progress (a JSON string); empty if unreadable.
    static func completedDays(_ progressJSON: String?) -> Set<Int> {
        guard let text = progressJSON, !text.isEmpty,
              let data = text.data(using: .utf8),
              let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let list = object["completed_days"] as? [Any] else { return [] }
        return Set(list.compactMap { ($0 as? NSNumber)?.intValue })
    }

    /// Highest day N such that every section has completed days 1...N (same rule as the web app's home screen).
    static func fullyCompletedThrough(_ sets: [Set<Int>], total: Int = totalDays) -> Int {
        guard !sets.isEmpty else { return 0 }
        var n = 0
        while n < total && sets.allSatisfy({ $0.contains(n + 1) }) { n += 1 }
        return n
    }
}
