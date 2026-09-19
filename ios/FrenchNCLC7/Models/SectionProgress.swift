import Foundation

/// One section's saved progress. The field names and shapes are exactly what the web app saves
/// (so a day completed on the phone shows up on the web and the other way round).
struct SectionProgress: Codable, Equatable {
    var current_day: Int = 1
    var completed_days: [Int] = []
    var last_activity_date: String? = nil
    var streak_count: Int = 0
    var longest_streak: Int = 0

    init(current_day: Int = 1, completed_days: [Int] = [], last_activity_date: String? = nil,
         streak_count: Int = 0, longest_streak: Int = 0) {
        self.current_day = current_day
        self.completed_days = completed_days
        self.last_activity_date = last_activity_date
        self.streak_count = streak_count
        self.longest_streak = longest_streak
    }

    // Written out by hand so a missing date is saved as null (as the web app does), not left out.
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(current_day, forKey: .current_day)
        try c.encode(completed_days, forKey: .completed_days)
        try c.encode(last_activity_date, forKey: .last_activity_date)
        try c.encode(streak_count, forKey: .streak_count)
        try c.encode(longest_streak, forKey: .longest_streak)
    }

    enum CodingKeys: String, CodingKey {
        case current_day, completed_days, last_activity_date, streak_count, longest_streak
    }
}

struct Completion: Equatable {
    let progress: SectionProgress
    let streak: Int
}

enum StudyLogic {
    /// A date the way the web app stores it (JavaScript's toDateString), e.g. "Tue Mar 10 2026".
    static func dateKey(_ date: Date, calendar: Calendar = .current) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone
        formatter.dateFormat = "EEE MMM dd yyyy"
        return formatter.string(from: date)
    }

    /// Marks `day` complete and moves on to the next day. The streak counts real-world days, not
    /// curriculum days: the first completion of a calendar day adds one if you were active yesterday,
    /// otherwise starts again at 1; more completions on the same day leave it alone.
    static func completeDay(_ progress: SectionProgress, day: Int, today: Date = Date(), calendar: Calendar = .current) -> Completion {
        let todayKey = dateKey(today, calendar: calendar)
        var streak = progress.streak_count
        var longest = progress.longest_streak
        if progress.last_activity_date != todayKey {
            let yesterday = calendar.date(byAdding: .day, value: -1, to: today) ?? today
            streak = progress.last_activity_date == dateKey(yesterday, calendar: calendar) ? streak + 1 : 1
            longest = max(longest, streak)
        }
        return Completion(
            progress: SectionProgress(
                current_day: progress.current_day + 1,
                completed_days: progress.completed_days + [day],
                last_activity_date: todayKey,
                streak_count: streak,
                longest_streak: longest
            ),
            streak: streak
        )
    }

    static func encode(_ progress: SectionProgress) -> String {
        guard let data = try? JSONEncoder().encode(progress), let text = String(data: data, encoding: .utf8) else { return "{}" }
        return text
    }

    /// nil if the saved text can't be read (which is different from nothing being saved).
    static func decode(_ text: String) -> SectionProgress? {
        guard let data = text.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(SectionProgress.self, from: data)
    }
}
