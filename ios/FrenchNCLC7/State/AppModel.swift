import Foundation
import SwiftUI

/// Where the user is.
enum Screen: Equatable {
    case loading
    case auth
    case home
    /// Read-only view of a day (used for Anki until its flashcard sessions are built).
    case day(PlanSection, Int)
    /// The day-by-day study screen with "Mark day complete" and streaks.
    case study
}

enum StudyPhase: Equatable {
    case day, complete, finished
}

/// The day just completed, for the "Day N done" screen.
struct CompletionInfo: Equatable {
    let day: Int
    let remaining: Int
    let streak: Int
}

struct StudyState: Equatable {
    var section: PlanSection
    var loading = true
    var progress = SectionProgress()
    /// The saved progress couldn't be read: saving is switched off so it can never be overwritten.
    var loadFailed = false
    /// A save didn't go through.
    var saveFailed = false
    var viewDay = 1
    var phase: StudyPhase = .day
    var completion: CompletionInfo?
    var confirmingReset = false
}

@MainActor
final class AppModel: ObservableObject {
    @Published var screen: Screen = .loading
    @Published var session: Session?
    @Published var username: String?
    @Published var tier: Tier = .free
    @Published var themeId: String
    /// Highest day fully completed in every section; nil while loading or if it couldn't be read.
    @Published var completedThrough: Int?
    @Published var authBusy = false
    @Published var authError: String?
    @Published var authNotice: String?
    @Published var study: StudyState?

    let plan = PlanRepository()
    private let api = SupabaseAPI()
    private let store = LocalStore()

    var colors: AppColors { Themes.get(themeId) }

    init() {
        themeId = store.themeId
        if let saved = store.loadSession() {
            Task { [self] in await enter(saved) }
        } else {
            screen = .auth
        }
    }

    /// Runs a server call with the current session, refreshing the sign-in once if it has expired.
    private func authed<T>(_ block: (Session) async throws -> T) async throws -> T {
        guard var s = session else { throw APIError("Not signed in.", status: 401) }
        do {
            return try await block(s)
        } catch let error as APIError where error.status == 401 && !s.refreshToken.isEmpty {
            s = try await api.refresh(s.refreshToken)
            store.saveSession(s)
            session = s
            return try await block(s)
        }
    }

    /// Signed in: load who they are, their tier and their overall progress, then show Home.
    private func enter(_ start: Session) async {
        session = start
        do {
            let result: (String?, Tier, Int?) = try await authed { s in
                let name = await self.api.username(s)
                let tier = await self.api.tier(s)
                let through = try await self.overallProgress(s)
                return (name, tier, through)
            }
            username = result.0
            tier = result.1
            completedThrough = result.2
            authError = nil
            screen = .home
        } catch let error as APIError where error.status == 401 {
            // The saved sign-in is no longer valid.
            store.clearSession()
            session = nil
            authError = "Please sign in again."
            screen = .auth
        } catch {
            // Offline or a server hiccup: stay signed in, show Home without the extras.
            authError = nil
            screen = .home
        }
    }

    private func overallProgress(_ s: Session) async throws -> Int? {
        guard let saved = try await api.appState(s, keys: PlanSection.allCases.map { $0.storageKey }) else { return nil }
        return PlanProgress.fullyCompletedThrough(
            PlanSection.allCases.map { PlanProgress.completedDays(saved[$0.storageKey]) }
        )
    }

    /// Re-reads the overall "Day N complete" number (after studying, for example).
    private func refreshOverview() {
        Task { [self] in
            if let through = try? await authed({ try await self.overallProgress($0) }) {
                completedThrough = through
            }
        }
    }

    func signIn(useUsername: Bool, who: String, password: String) {
        let trimmed = who.trimmingCharacters(in: .whitespaces)
        if trimmed.isEmpty || password.isEmpty {
            authError = "Enter your " + (useUsername ? "username" : "email") + " and password."
            return
        }
        authBusy = true
        authError = nil
        authNotice = nil
        Task { [self] in
            do {
                let s: Session
                if useUsername {
                    s = try await api.signIn(username: trimmed, password: password)
                } else {
                    s = try await api.signIn(email: trimmed, password: password)
                }
                store.saveSession(s)
                authBusy = false
                await enter(s)
            } catch {
                authBusy = false
                authError = error.localizedDescription
            }
        }
    }

    func signUp(email: String, username: String, password: String) {
        let name = username.trimmingCharacters(in: .whitespaces)
        let nameOK = name.range(of: "^[A-Za-z0-9_]{3,20}$", options: .regularExpression) != nil
        if !nameOK {
            authError = "Username must be 3-20 letters, numbers or underscores."
        } else if !email.contains("@") {
            authError = "Enter a valid email address."
        } else if password.count < 6 {
            authError = "Password must be at least 6 characters."
        } else {
            authBusy = true
            authError = nil
            authNotice = nil
            Task { [self] in
                do {
                    let available = try await api.usernameAvailable(name)
                    if !available {
                        authBusy = false
                        authError = "That username is taken."
                        return
                    }
                    try await api.signUp(email: email.trimmingCharacters(in: .whitespaces), password: password, username: name)
                    authBusy = false
                    authNotice = "Account created. Check your email to confirm it, then sign in."
                } catch {
                    authBusy = false
                    authError = error.localizedDescription
                }
            }
        }
    }

    func clearAuthMessages() {
        authError = nil
        authNotice = nil
    }

    func signOut() {
        store.clearSession()
        session = nil
        username = nil
        tier = .free
        completedThrough = nil
        study = nil
        authError = nil
        authNotice = nil
        screen = .auth
    }

    func setTheme(_ id: String) {
        store.themeId = id
        themeId = id
    }

    // MARK: Navigation

    /// Opens a section on a day. Grammar, Kwiziq, TV5MONDE and Writing use the study screen; Anki the read-only viewer.
    func open(_ section: PlanSection, day: Int? = nil) {
        if section == .anki {
            study = nil
            screen = .day(section, day ?? 1)
            return
        }
        if var current = study, current.section == section, !current.loading {
            // Already loaded (switching days inside the same section): just move.
            current.viewDay = min(max(day ?? current.viewDay, 1), totalDays)
            current.phase = .day
            study = current
            screen = .study
        } else {
            openStudy(section, startDay: day)
        }
    }

    /// Home. Also re-reads the overall progress so "Day N complete" reflects what was just done.
    func goHome() {
        let hadStudy = study != nil
        study = nil
        screen = .home
        if hadStudy { refreshOverview() }
    }

    // MARK: Study (Grammar, Kwiziq, TV5MONDE, Writing)

    private func clampDay(_ day: Int) -> Int { min(max(day, 1), totalDays) }

    private func openStudy(_ section: PlanSection, startDay: Int?) {
        study = StudyState(section: section)
        screen = .study
        Task { [self] in
            do {
                let read = try await authed { try await self.api.readAppValue($0, key: section.storageKey) }
                var failed = false
                var progress = SectionProgress()
                switch read {
                case .empty:
                    break
                case .failed:
                    failed = true
                case .found(let text):
                    if let decoded = StudyLogic.decode(text) { progress = decoded } else { failed = true }
                }
                let start = clampDay(startDay ?? progress.current_day)
                updateStudy(section) {
                    $0.loading = false
                    $0.progress = progress
                    $0.loadFailed = failed
                    $0.viewDay = start
                }
            } catch {
                // Couldn't read: never treat that as "nothing saved" (saving stays off).
                let start = clampDay(startDay ?? 1)
                updateStudy(section) {
                    $0.loading = false
                    $0.loadFailed = true
                    $0.viewDay = start
                }
            }
        }
    }

    private func updateStudy(_ section: PlanSection, _ change: (inout StudyState) -> Void) {
        guard var s = study, s.section == section else { return }
        change(&s)
        study = s
    }

    func studyMove(_ delta: Int) {
        guard var s = study else { return }
        s.viewDay = clampDay(s.viewDay + delta)
        study = s
    }

    /// Saves progress unless the load failed (in which case the real saved progress must not be overwritten).
    private func persist(_ section: PlanSection, _ progress: SectionProgress) {
        guard let current = study, !current.loadFailed else { return }
        let text = StudyLogic.encode(progress)
        Task { [self] in
            do {
                try await authed { try await self.api.saveAppState($0, key: section.storageKey, jsonText: text) }
                updateStudy(section) { $0.saveFailed = false }
            } catch {
                updateStudy(section) { $0.saveFailed = true }
            }
        }
    }

    func completeDay() {
        guard var s = study else { return }
        let pending = s.viewDay == s.progress.current_day && s.progress.current_day <= totalDays
        if s.loading || !pending { return }
        let done = StudyLogic.completeDay(s.progress, day: s.viewDay)
        let next = done.progress
        s.completion = CompletionInfo(day: s.viewDay, remaining: totalDays - next.completed_days.count, streak: done.streak)
        s.progress = next
        s.phase = next.current_day > totalDays ? .finished : .complete
        study = s
        persist(s.section, next)
    }

    func continueNext() {
        guard var s = study else { return }
        if s.progress.current_day > totalDays {
            s.phase = .finished
        } else {
            s.viewDay = s.progress.current_day
            s.phase = .day
        }
        study = s
    }

    func askReset(_ confirming: Bool) {
        guard var s = study else { return }
        s.confirmingReset = confirming
        study = s
    }

    func doReset() {
        guard var s = study else { return }
        let fresh = SectionProgress()
        s.progress = fresh
        s.confirmingReset = false
        s.viewDay = 1
        s.phase = .day
        s.completion = nil
        study = s
        persist(s.section, fresh)
    }
}
