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
    /// The Writing section: editor, AI feedback, mark day complete.
    case writing
    /// The Anki flashcards.
    case anki
    /// Manage users' tiers (super users only).
    case admin
    /// The personal word list (Premium and Super).
    case wordBank
    /// Free versus Premium, with monthly/yearly.
    case plans
    /// Delete my account (not offered to Super accounts).
    case deleteAccount
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

/// A grammar PDF being read in the app.
struct PdfDocumentInfo: Equatable {
    let label: String
    let data: Data
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
    /// Grammar chapter PDFs: a request is running / it failed / one is open for reading.
    var pdfLoading = false
    var pdfError: String?
    var pdfViewer: PdfDocumentInfo?
    /// Direct lesson links (Kwiziq / TV5MONDE, premium and super). Empty for everyone else.
    var lessonLinks = LessonLinks.empty
}

enum SaveState: Equatable {
    case idle, saving, saved
}

enum FeedbackUI: Equatable {
    case idle, loading, busy, failed
}

struct WritingState: Equatable {
    var loading = true
    var progress = SectionProgress()
    /// What was written (and the AI's feedback) for each day.
    var entries: [Int: WritingEntry] = [:]
    /// Saved progress or writing couldn't be read: saving is switched off so it can never be overwritten.
    var loadFailed = false
    var saveFailed = false
    var viewDay = 1
    var phase: StudyPhase = .day
    var completion: CompletionInfo?
    var confirmingReset = false
    var saveState: SaveState = .idle
    var feedback: FeedbackUI = .idle
    /// Today's AI feedback allowance; nil until loaded.
    var quota: FeedbackQuota?
    /// Goes up on every reset, so the text box starts empty again.
    var resetCount = 0
}

struct AnkiState: Equatable {
    var loading = true
    var progress = SectionProgress()
    /// Cards marked "hard" (they come up more often in review), in the order they were marked.
    var hard: [String] = []
    var stats: [String: CardStat] = [:]
    var session: AnkiSession?
    var index = 0
    var revealed = false
    /// .day = a session is running.
    var phase: StudyPhase = .day
    var completion: CompletionInfo?
    /// A bonus round for a chosen day: nothing about progress, streak or stats changes.
    var practice = false
    /// Saved progress couldn't be read: saving is switched off so it can never be overwritten.
    var loadFailed = false
    var saveFailed = false
    var confirmingReset = false
    /// The person's Word Bank words; they join the review words each time a session is built.
    var customWords: [WordBankWord] = []
    /// Cards seen today (saved as anki-daily).
    var dailySeen = 0
    /// Cards of the current session already added to today's total.
    var counted = 0
    /// Today's limit is used up, so no new session can start until tomorrow.
    var limitHit = false
}

/// The Plans screen: which billing period is showing and where a purchase attempt is up to.
struct PlansState: Equatable {
    var period: BillingPeriod = .yearly
    var busy = false
    var message: String?
}

/// The delete-account screen: the typed confirmation, the password and where the request is up to.
struct DeleteAccountState: Equatable {
    var typed = ""
    var password = ""
    var busy = false
    var error: String?
    var done = false
}

/// The Word Bank screen: the list, the add form, editing and the small confirmations.
struct WordBankState: Equatable {
    /// nil while loading.
    var words: [WordBankWord]?
    var loadError = false
    var query = ""
    var showCount = 100
    var french = ""
    var english = ""
    var note = ""
    var addError: String?
    var busy = false
    var editingId: String?
    var editFrench = ""
    var editEnglish = ""
    var editNote = ""
    var editError: String?
    var confirmId: String?
    var confirmReset = false
    var notice: String?
}

/// A finished day-plan PDF waiting to be saved (through the share sheet: "Save to Files").
struct PdfReady: Equatable {
    let fileName: String
    let url: URL
    let claimId: Int
}

struct DayPlanState: Equatable {
    /// Whether another download is allowed right now; nil until known.
    var quota: PdfQuota?
    var busy = false
    var error: String?
    var ready: PdfReady?
}

struct AdminState: Equatable {
    /// nil while loading.
    var users: [AdminUser]?
    var loadError: String?
    var query = ""
    /// People whose tier change is being saved right now.
    var saving: Set<String> = []
    var rowErrors: [String: String] = [:]
    /// Someone about to be made super, waiting for the yes/no.
    var confirmSuper: AdminUser?
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
    @Published var writing: WritingState?
    @Published var anki: AnkiState?
    @Published var dayPlan = DayPlanState()
    @Published var admin: AdminState?
    @Published var wordBank: WordBankState?
    @Published var plans = PlansState()
    @Published var deleteAccount: DeleteAccountState?
    /// Apple's In-App Purchase sits behind this; `NotConfiguredBilling` until the App Store Connect products exist.
    private let billing: AppStoreBilling = NotConfiguredBilling()

    let plan = PlanRepository()
    private let api = SupabaseAPI()
    private let store = LocalStore()
    private var writingSaveTask: Task<Void, Never>?
    private var writingSavePending = false
    private var writingLoadFailed = false
    private var ankiLoadFailed = false
    private let speech = SpeechPlayer()
    private var speakTask: Task<Void, Never>?

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
            // If the saved sign-in can't be renewed (the server says no, e.g. the account or session is gone),
            // treat it as signed out. A network problem (no status) is passed on as it is.
            do {
                s = try await api.refresh(s.refreshToken)
            } catch let refreshError as APIError where (400...499).contains(refreshError.status) {
                throw APIError("Please sign in again.", status: 401)
            }
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

    /// "Forgot password?": emails a reset link. What comes back says nothing about whether the account exists.
    func sendPasswordReset(email: String) {
        guard AccountLogic.isEmail(email) else {
            authError = "Enter a valid email address."
            authNotice = nil
            return
        }
        authBusy = true
        authError = nil
        authNotice = nil
        Task { [self] in
            do {
                try await api.recoverPassword(email: email.trimmingCharacters(in: .whitespaces))
                authBusy = false
                authNotice = AccountLogic.resetSentMessage(email)
            } catch {
                authBusy = false
                authError = (error as? APIError)?.message ?? "Couldn't send the reset link. Try again in a moment."
            }
        }
    }

    func clearAuthMessages() {
        authError = nil
        authNotice = nil
    }

    func signOut() {
        stopSpeech()
        store.clearSession()
        session = nil
        username = nil
        tier = .free
        completedThrough = nil
        study = nil
        writing = nil
        anki = nil
        admin = nil
        wordBank = nil
        deleteAccount = nil
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
        // Remember where we came from: from a day page, Back returns to that day; from Home, Back returns to Home.
        switch screen {
        case .day(_, let here): returnTo = .day(section, here)
        case .home: returnTo = nil
        default: break // moving between sections keeps what was remembered
        }
        if section == .anki {
            flushWriting()
            openAnki(practiceDay: day)
            return
        }
        if section == .writing {
            openWriting(startDay: day)
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

    /// The day page a section was opened from (Home's "Jump to a day"). Back from that section returns here,
    /// with that section selected. Nil when the section was opened straight from Home.
    private var returnTo: Screen?

    /// The read-only day viewer (Home's "Jump to a day"). Moving to another day keeps the section that is
    /// showing; pass `section` to switch to a different one.
    func browseDay(_ day: Int, section: PlanSection? = nil) {
        flushWriting()
        stopSpeech()
        var shown = section ?? .anki
        if section == nil, case .day(let current, _) = screen { shown = current }
        study = nil
        writing = nil
        anki = nil
        screen = .day(shown, clampDay(day))
    }

    /// Back from a section (Grammar, Kwiziq, TV5MONDE, Writing, Anki): to the day page it was opened from if it
    /// was opened from one, otherwise Home.
    func goBack() {
        guard let target = returnTo else {
            goHome()
            return
        }
        returnTo = nil
        let hadStudy = study != nil || writing != nil || anki != nil
        flushWriting()
        stopSpeech()
        study = nil
        writing = nil
        anki = nil
        admin = nil
        screen = target
        if hadStudy { refreshOverview() }
    }

    /// Home. Also re-reads the overall progress so "Day N complete" reflects what was just done.
    func goHome() {
        returnTo = nil
        let hadStudy = study != nil || writing != nil || anki != nil
        flushWriting()
        stopSpeech()
        study = nil
        writing = nil
        anki = nil
        admin = nil
        wordBank = nil
        deleteAccount = nil
        screen = .home
        if hadStudy { refreshOverview() }
    }

    // MARK: Study (Grammar, Kwiziq, TV5MONDE, Writing)

    private func clampDay(_ day: Int) -> Int { min(max(day, 1), totalDays) }

    private func openStudy(_ section: PlanSection, startDay: Int?) {
        study = StudyState(section: section)
        screen = .study
        // Direct lesson links: only premium and super ask for them (free accounts keep the Google searches).
        if let linkModule = LessonLinkLogic.moduleFor(section), tier.atLeast(.premium) {
            Task { [self] in
                let links = (try? await authed { try await self.api.lessonLinks($0, module: linkModule) }) ?? .empty
                updateStudy(section) { $0.lessonLinks = links }
            }
        }
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

    // MARK: Writing

    private func updateWriting(_ change: (inout WritingState) -> Void) {
        guard var w = writing else { return }
        change(&w)
        writing = w
    }

    private func writingTask(_ day: Int) -> String {
        plan.days(.writing).first { $0.day == day }?.text ?? ""
    }

    private func openWriting(startDay: Int?) {
        if var current = writing, !current.loading {
            // Switching days inside Writing: keep what is loaded.
            flushWriting()
            current = writing ?? current
            current.viewDay = clampDay(startDay ?? current.viewDay)
            current.phase = .day
            current.saveState = .idle
            current.feedback = .idle
            writing = current
            screen = .writing
            return
        }
        writingLoadFailed = false
        study = nil
        writing = WritingState()
        screen = .writing
        Task { [self] in // the AI allowance loads alongside, without holding up the screen
            let quota = try? await authed { try await self.api.feedbackQuota($0) }
            updateWriting { $0.quota = quota ?? nil }
        }
        Task { [self] in
            do {
                let result = try await authed { s in
                    (try await self.api.readAppValue(s, key: PlanSection.writing.storageKey),
                     try await self.api.readAppValue(s, key: "writing-entries"))
                }
                var failed = false
                var progress = SectionProgress()
                var entries: [Int: WritingEntry] = [:]
                switch result.0 {
                case .empty: break
                case .failed: failed = true
                case .found(let text):
                    if let decoded = StudyLogic.decode(text) { progress = decoded } else { failed = true }
                }
                switch result.1 {
                case .empty: break
                case .failed: failed = true
                case .found(let text):
                    if let decoded = WritingLogic.decodeEntries(text) { entries = decoded } else { failed = true }
                }
                writingLoadFailed = failed
                let start = clampDay(startDay ?? progress.current_day)
                updateWriting {
                    $0.loading = false
                    $0.progress = progress
                    $0.entries = entries
                    $0.loadFailed = failed
                    $0.viewDay = start
                }
            } catch {
                // Couldn't read: never treat that as "nothing saved" (saving stays off).
                writingLoadFailed = true
                let start = clampDay(startDay ?? 1)
                updateWriting {
                    $0.loading = false
                    $0.loadFailed = true
                    $0.viewDay = start
                }
            }
        }
    }

    /// Saves one Writing value unless the load failed (in which case what is saved must not be overwritten).
    private func persistWriting(_ key: String, _ jsonText: String) {
        if writingLoadFailed { return }
        Task { [self] in
            do {
                try await authed { try await self.api.saveAppState($0, key: key, jsonText: jsonText) }
                updateWriting { $0.saveFailed = false }
            } catch {
                updateWriting { $0.saveFailed = true }
            }
        }
    }

    /// If a typing-pause save is waiting, do it now (before switching day, completing, or leaving).
    private func flushWriting() {
        if writingSavePending {
            writingSaveTask?.cancel()
            writingSavePending = false
            if let w = writing { persistWriting("writing-entries", WritingLogic.encodeEntries(w.entries)) }
            updateWriting { $0.saveState = .saved }
        }
        writingSaveTask = nil
    }

    /// Called on every change to the text box. The text is saved a second after typing stops.
    func writingDraftChanged(_ rawText: String) {
        guard var w = writing, !w.loading else { return }
        let text = String(rawText.prefix(WritingLogic.maxDraftChars))
        let day = w.viewDay
        w.entries[day] = WritingEntry(text: text, feedback: w.entries[day]?.feedback)
        w.saveState = .saving
        writing = w
        writingSaveTask?.cancel()
        writingSavePending = true
        writingSaveTask = Task { [self] in
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            if Task.isCancelled { return }
            if let current = writing { persistWriting("writing-entries", WritingLogic.encodeEntries(current.entries)) }
            writingSavePending = false
            updateWriting { $0.saveState = .saved }
        }
    }

    func writingMove(_ delta: Int) {
        guard let w = writing else { return }
        let next = clampDay(w.viewDay + delta)
        if next == w.viewDay { return }
        flushWriting()
        updateWriting {
            $0.viewDay = next
            $0.saveState = .idle
            $0.feedback = .idle
        }
    }

    /// Asks the AI for feedback on today's draft. Only a successful reply uses up the allowance.
    func getWritingFeedback() {
        guard let w = writing else { return }
        let day = w.viewDay
        guard let draft = w.entries[day]?.text,
              !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              w.feedback != .loading,
              w.quota?.limitReached() != true else { return }
        updateWriting { $0.feedback = .loading }
        let task = writingTask(day)
        Task { [self] in
            let outcome: FeedbackOutcome
            do {
                outcome = try await authed { try await self.api.writingFeedback($0, task: task, draft: draft) }
            } catch {
                outcome = .failed
            }
            switch outcome {
            case .success(let text, let quota):
                var saved = ""
                updateWriting {
                    $0.entries[day] = WritingEntry(text: draft, feedback: text)
                    if let quota { $0.quota = quota }
                    $0.feedback = .idle
                    saved = WritingLogic.encodeEntries($0.entries)
                }
                if !saved.isEmpty { persistWriting("writing-entries", saved) }
            case .limitReached(let quota):
                // The limit line under the button explains it; no separate error is needed.
                updateWriting {
                    if let quota { $0.quota = quota }
                    $0.feedback = .idle
                }
            case .busy:
                updateWriting { $0.feedback = .busy }
            case .failed:
                updateWriting { $0.feedback = .failed }
            }
        }
    }

    func completeWritingDay() {
        guard let w = writing else { return }
        let pending = w.viewDay == w.progress.current_day && w.progress.current_day <= totalDays
        if w.loading || !pending { return }
        flushWriting()
        let done = StudyLogic.completeDay(w.progress, day: w.viewDay)
        let next = done.progress
        updateWriting {
            $0.progress = next
            $0.completion = CompletionInfo(day: w.viewDay, remaining: totalDays - next.completed_days.count, streak: done.streak)
            $0.phase = next.current_day > totalDays ? .finished : .complete
        }
        persistWriting(PlanSection.writing.storageKey, StudyLogic.encode(next))
    }

    func continueWriting() {
        guard let w = writing else { return }
        if w.progress.current_day > totalDays {
            updateWriting { $0.phase = .finished }
        } else {
            flushWriting()
            updateWriting {
                $0.viewDay = w.progress.current_day
                $0.phase = .day
                $0.saveState = .idle
                $0.feedback = .idle
            }
        }
    }

    func askWritingReset(_ confirming: Bool) {
        updateWriting { $0.confirmingReset = confirming }
    }

    func doWritingReset() {
        guard writing != nil else { return }
        flushWriting()
        let fresh = SectionProgress()
        updateWriting {
            $0.progress = fresh
            $0.entries = [:]
            $0.confirmingReset = false
            $0.viewDay = 1
            $0.phase = .day
            $0.completion = nil
            $0.saveState = .idle
            $0.feedback = .idle
            $0.resetCount += 1
        }
        persistWriting(PlanSection.writing.storageKey, StudyLogic.encode(fresh))
        persistWriting("writing-entries", WritingLogic.encodeEntries([:]))
    }

    // MARK: Anki flashcards

    private func updateAnki(_ change: (inout AnkiState) -> Void) {
        guard var a = anki else { return }
        change(&a)
        anki = a
    }

    private func todayKey() -> String { StudyLogic.dateKey(Date()) }

    /// Saves today's card count (shared with the web app as anki-daily).
    private func persistDaily(_ seen: Int) {
        persistAnki("anki-daily", AnkiLimits.encodeCount(date: todayKey(), seen: seen))
    }

    /// Starts a session for `day`: sized for the person's tier, with their Word Bank words mixed into the reviews,
    /// and the first card counted towards today's limit. If today's limit is already used up, no session starts.
    private func newAnkiSession(_ a: AnkiState, day: Int, practice: Bool) -> AnkiState {
        var out = a
        if AnkiLimits.limitReached(tier, seen: a.dailySeen) {
            out.session = nil
            out.index = 0
            out.revealed = false
            out.practice = practice
            out.phase = .day
            out.limitHit = true
            out.counted = 0
            return out
        }
        let session = AnkiLogic.buildSession(days: plan.days(.anki), currentDay: day, completedCount: a.progress.completed_days.count,
                                             hard: Set(a.hard), custom: WordBankLogic.toCards(a.customWords), tier: tier,
                                             practice: practice, seen: a.dailySeen)
        let first = (AnkiLimits.dailyLimit(tier) != nil && (session?.items.isEmpty == false)) ? 1 : 0
        out.session = session
        out.index = 0
        out.revealed = false
        out.practice = practice
        out.phase = .day
        out.limitHit = false
        out.counted = first
        out.dailySeen = a.dailySeen + first
        return out
    }

    /// Opens the flashcards. With no `practiceDay` it is today's real session; with one it is a bonus
    /// practice round for that day (no progress, streak or stats change).
    private func openAnki(practiceDay: Int?) {
        ankiLoadFailed = false
        stopSpeech()
        study = nil
        writing = nil
        anki = AnkiState()
        screen = .anki
        Task { [self] in
            do {
                let reads = try await authed { s in
                    (try await self.api.readAppValue(s, key: "progress"),
                     try await self.api.readAppValue(s, key: "hard-words"),
                     try await self.api.readAppValue(s, key: "card-stats"),
                     try await self.api.readAppValue(s, key: "anki-daily"))
                }
                var failed = false
                var progress = SectionProgress()
                var hard: [String] = []
                var stats: [String: CardStat] = [:]
                switch reads.0 {
                case .empty: break
                case .failed: failed = true
                case .found(let text):
                    if let decoded = StudyLogic.decode(text) { progress = decoded } else { failed = true }
                }
                switch reads.1 {
                case .empty: break
                case .failed: failed = true
                case .found(let text):
                    if let decoded = AnkiLogic.decodeHard(text) { hard = decoded } else { failed = true }
                }
                switch reads.2 {
                case .empty: break
                case .failed: failed = true
                case .found(let text):
                    if let decoded = AnkiLogic.decodeStats(text) { stats = decoded } else { failed = true }
                }
                var seen = 0
                switch reads.3 {
                case .empty: break
                case .failed: failed = true
                case .found(let text): seen = AnkiLimits.todaysCount(text, today: todayKey())
                }
                ankiLoadFailed = failed
                // Word Bank words (none for free accounts); never blocks Anki if they can't be loaded.
                let customWords = (try? await authed { try await self.api.wordBankList($0) }) ?? []
                let practice = practiceDay != nil
                let finished = !practice && progress.current_day > totalDays
                var base = AnkiState()
                base.loading = false
                base.progress = progress
                base.hard = hard
                base.stats = stats
                base.loadFailed = failed
                base.customWords = customWords
                base.dailySeen = seen
                let started: AnkiState
                if finished {
                    base.phase = .finished
                    started = base
                } else {
                    started = newAnkiSession(base, day: practiceDay.map { clampDay($0) } ?? progress.current_day, practice: practice)
                }
                anki = started
                if started.dailySeen != seen { persistDaily(started.dailySeen) }
            } catch {
                // Couldn't read: never treat that as "nothing saved" (saving stays off).
                ankiLoadFailed = true
                updateAnki {
                    $0.loading = false
                    $0.loadFailed = true
                }
            }
        }
    }

    /// Saves one Anki value unless the load failed (in which case what is saved must not be overwritten).
    private func persistAnki(_ key: String, _ jsonText: String) {
        if ankiLoadFailed { return }
        Task { [self] in
            do {
                try await authed { try await self.api.saveAppState($0, key: key, jsonText: jsonText) }
                updateAnki { $0.saveFailed = false }
            } catch {
                updateAnki { $0.saveFailed = true }
            }
        }
    }

    func ankiShowAnswer() {
        updateAnki { if $0.session != nil && !$0.revealed { $0.revealed = true } }
    }

    func ankiNext() {
        guard let a = anki, let session = a.session else { return }
        let next = a.index + 1
        if next >= session.items.count {
            finishAnkiSession()
            return
        }
        // Only cards not seen before are added to today's total, so going back over a card doesn't count it twice.
        let counted = AnkiLimits.dailyLimit(tier) != nil ? max(a.counted, next + 1) : a.counted
        let added = counted - a.counted
        updateAnki {
            $0.index = next
            $0.revealed = false
            $0.counted = counted
            $0.dailySeen += added
        }
        if added > 0 { persistDaily(a.dailySeen + added) }
    }

    func ankiPrevious() {
        updateAnki {
            if $0.index > 0 {
                $0.index -= 1
                $0.revealed = false
            }
        }
    }

    func ankiToggleHard(_ cardId: String) {
        guard let a = anki else { return }
        let adding = !a.hard.contains(cardId)
        let hard = adding ? a.hard + [cardId] : a.hard.filter { $0 != cardId }
        let stats = adding ? AnkiLogic.markHard(a.stats, cardId) : a.stats
        updateAnki {
            $0.hard = hard
            $0.stats = stats
        }
        if adding { persistAnki("card-stats", AnkiLogic.encodeStats(stats)) }
        persistAnki("hard-words", AnkiLogic.encodeHard(hard))
    }

    private func finishAnkiSession() {
        guard let a = anki, let session = a.session else { return }
        if a.practice {
            // Bonus practice: no progress, streak or card-stat changes.
            updateAnki {
                $0.practice = false
                $0.phase = .complete
                $0.completion = CompletionInfo(day: session.dayNumber, remaining: totalDays - a.progress.completed_days.count,
                                               streak: a.progress.streak_count)
            }
            return
        }
        let done = StudyLogic.completeDay(a.progress, day: session.dayNumber)
        let next = done.progress
        let stats = AnkiLogic.markSeen(a.stats, session)
        updateAnki {
            $0.progress = next
            $0.stats = stats
            $0.completion = CompletionInfo(day: session.dayNumber, remaining: totalDays - next.completed_days.count, streak: done.streak)
            $0.phase = next.current_day > totalDays ? .finished : .complete
        }
        persistAnki("card-stats", AnkiLogic.encodeStats(stats))
        persistAnki("progress", StudyLogic.encode(next))
    }

    func ankiPracticeAgain(_ day: Int) {
        guard let a = anki else { return }
        stopSpeech()
        let started = newAnkiSession(a, day: day, practice: true)
        anki = started
        if started.dailySeen != a.dailySeen { persistDaily(started.dailySeen) }
    }

    func ankiContinueToNextDay() {
        guard let a = anki else { return }
        stopSpeech()
        if a.progress.current_day > totalDays {
            updateAnki { $0.phase = .finished }
            return
        }
        let started = newAnkiSession(a, day: a.progress.current_day, practice: false)
        anki = started
        if started.dailySeen != a.dailySeen { persistDaily(started.dailySeen) }
    }

    func ankiAskReset(_ confirming: Bool) {
        updateAnki { $0.confirmingReset = confirming }
    }

    func ankiDoReset() {
        let fresh = SectionProgress()
        guard var reset = anki else { return }
        stopSpeech()
        let before = reset.dailySeen
        reset.progress = fresh
        reset.hard = []
        reset.stats = [:]
        reset.confirmingReset = false
        reset.completion = nil
        let started = newAnkiSession(reset, day: 1, practice: false)
        anki = started
        if started.dailySeen != before { persistDaily(started.dailySeen) }
        persistAnki("progress", StudyLogic.encode(fresh))
        persistAnki("hard-words", AnkiLogic.encodeHard([]))
        persistAnki("card-stats", AnkiLogic.encodeStats([:]))
    }

    // MARK: Audio (French pronunciation)

    /// Says a French word or phrase. Quietly does nothing if the audio isn't available.
    func speak(_ text: String) {
        speakTask?.cancel()
        speakTask = Task { [self] in
            let audio = try? await authed { try await self.api.textToSpeech($0, text: text) }
            if Task.isCancelled { return }
            if let audio, let data = audio { speech.play(data) }
        }
    }

    private func stopSpeech() {
        speakTask?.cancel()
        speech.stop()
    }

    // MARK: Grammar chapter PDFs (premium and super)

    /// Asks for the pages of one book's chapters and opens them for reading. The server enforces the tier too.
    func openGrammarPdf(_ group: BookChapters) {
        guard let s = study, !s.pdfLoading else { return }
        var loading = s
        loading.pdfLoading = true
        loading.pdfError = nil
        study = loading
        Task { [self] in
            let result: GrammarPagesResult
            do {
                result = try await authed { try await self.api.grammarPages($0, book: group.book, chapters: group.chapters) }
            } catch {
                result = .failed
            }
            guard var current = study else { return }
            current.pdfLoading = false
            switch result {
            case .pdf(let data):
                current.pdfViewer = PdfDocumentInfo(label: group.label, data: data)
            case .tierRequired:
                current.pdfError = "Grammar chapter PDFs are a Premium feature."
            case .failed:
                current.pdfError = "Couldn't load those pages. Try again."
            }
            study = current
        }
    }

    func closeGrammarPdf() {
        guard var s = study else { return }
        s.pdfViewer = nil
        study = s
    }

    // MARK: Day-plan PDF download (premium: 1 per 24 hours, super: unlimited)

    /// Reads whether a download is allowed now (premium and super only; free accounts never see the button).
    func loadPdfQuota() {
        guard tier.atLeast(.premium) else { return }
        Task { [self] in
            let quota = try? await authed { try await self.api.pdfQuota($0) }
            dayPlan.quota = quota ?? nil
        }
    }

    private func refundPdf(_ id: Int) {
        Task { [self] in
            _ = try? await authed { try await self.api.refundPdfDownload($0, id: id) }
            loadPdfQuota()
        }
    }

    /// Reserves a download (the limit is enforced by the database, not the app), builds the PDF on the phone, and
    /// hands it to the screen to be saved. If building it fails, the download is given back.
    func requestDayPlanPdf(day: Int) {
        guard !dayPlan.busy, dayPlan.ready == nil else { return }
        dayPlan.busy = true
        dayPlan.error = nil
        Task { [self] in
            let claim = (try? await authed { try await self.api.claimPdfDownload($0, day: day) }) ?? nil
            guard let claim else {
                dayPlan.busy = false
                dayPlan.error = "Couldn't check your download allowance. Please try again."
                return
            }
            guard claim.ok, let id = claim.id else {
                // used up (or not allowed): show when the next one is available
                dayPlan.busy = false
                dayPlan.quota = claim.status ?? dayPlan.quota
                return
            }
            func dayOf(_ section: PlanSection) -> DayContent? { plan.days(section).first { $0.day == day } }
            guard let anki = dayOf(.anki), let grammar = dayOf(.grammar), let kwiziq = dayOf(.kwiziq),
                  let tv5 = dayOf(.tv5), let writing = dayOf(.writing) else {
                refundPdf(id)
                dayPlan.busy = false
                dayPlan.error = "Couldn't create the PDF. Your download was not used - please try again."
                return
            }
            let content = DayPlanLogic.build(anki: anki, grammar: grammar, kwiziq: kwiziq, tv5: tv5, writing: writing)
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.dateFormat = "MMM d, yyyy"
            let data = DayPlanPdf.render(content, dateText: formatter.string(from: Date()))
            let name = DayPlanLogic.fileName(day)
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
            do {
                try data.write(to: url, options: .atomic)
            } catch {
                refundPdf(id)
                dayPlan.busy = false
                dayPlan.error = "Couldn't create the PDF. Your download was not used - please try again."
                return
            }
            dayPlan.busy = false
            dayPlan.quota = claim.status ?? dayPlan.quota
            dayPlan.ready = PdfReady(fileName: name, url: url, claimId: id)
        }
    }

    /// The share sheet closed. If the PDF was saved or shared, the download stays used; if the person
    /// backed out, nothing was delivered, so the download is given back.
    func dayPlanShareFinished(saved: Bool) {
        guard let ready = dayPlan.ready else { return }
        dayPlan.ready = nil
        try? FileManager.default.removeItem(at: ready.url)
        if !saved { refundPdf(ready.claimId) }
    }

    // MARK: Admin: manage users' tiers (super users only)

    private func updateAdmin(_ change: (inout AdminState) -> Void) {
        guard var a = admin else { return }
        change(&a)
        admin = a
    }

    // MARK: Plans (Premium subscription)

    func openPlans() {
        returnTo = nil
        plans.message = nil
        screen = .plans
    }

    func setPlanPeriod(_ period: BillingPeriod) {
        plans.period = period
        plans.message = nil
    }

    func upgrade() { runBilling { await self.billing.purchase(self.plans.period) } }

    func manageSubscription() { runBilling { await self.billing.manage() } }

    private func runBilling(_ action: @escaping () async -> PurchaseResult) {
        guard !plans.busy else { return }
        plans.busy = true
        plans.message = nil
        Task { [self] in
            let result = await action()
            plans.busy = false
            plans.message = result == .notConfigured ? PlansLogic.notSwitchedOn : PlansLogic.purchaseFailed
        }
    }

    // MARK: Delete account

    /// Opens the delete-account screen. Super accounts don't get it (the server refuses them too).
    func openDeleteAccount() {
        guard AccountLogic.canDelete(tier) else { return }
        returnTo = nil
        deleteAccount = DeleteAccountState()
        screen = .deleteAccount
    }

    func setDeleteTyped(_ v: String) { deleteAccount?.typed = v; deleteAccount?.error = nil }
    func setDeletePassword(_ v: String) { deleteAccount?.password = v; deleteAccount?.error = nil }

    func confirmDeleteAccount() {
        guard let d = deleteAccount, !d.busy, AccountLogic.canConfirmDelete(typed: d.typed, password: d.password) else { return }
        deleteAccount?.busy = true
        deleteAccount?.error = nil
        Task { [self] in
            do {
                try await authed { try await self.api.deleteAccount($0, password: d.password) }
                deleteAccount = DeleteAccountState(done: true)
            } catch {
                deleteAccount?.busy = false
                deleteAccount?.error = (error as? APIError)?.message ?? AccountLogic.deleteFailed
            }
        }
    }

    // MARK: Word Bank (Premium and Super)

    private func updateWordBank(_ change: (inout WordBankState) -> Void) {
        guard var w = wordBank else { return }
        change(&w)
        wordBank = w
    }

    /// Opens the Word Bank. Free accounts see the locked screen; the database refuses them anyway.
    func openWordBank() {
        returnTo = nil
        wordBank = WordBankState()
        screen = .wordBank
        if tier.atLeast(.premium) { loadWordBank() }
    }

    func loadWordBank() {
        updateWordBank { $0.loadError = false }
        Task { [self] in
            do {
                let words = try await authed { try await self.api.wordBankList($0) }
                updateWordBank { $0.words = words }
            } catch {
                updateWordBank { state in
                    state.words = state.words ?? []
                    state.loadError = true
                }
            }
        }
    }

    func wbQuery(_ q: String) { updateWordBank { $0.query = q; $0.showCount = 100 } }
    func wbShowMore() { updateWordBank { $0.showCount += 100 } }
    func wbSetFrench(_ v: String) { updateWordBank { $0.french = String(v.prefix(WordBankLogic.maxFrench)) } }
    func wbSetEnglish(_ v: String) { updateWordBank { $0.english = String(v.prefix(WordBankLogic.maxEnglish)) } }
    func wbSetNote(_ v: String) { updateWordBank { $0.note = String(v.prefix(WordBankLogic.maxNote)) } }
    func wbSetEditFrench(_ v: String) { updateWordBank { $0.editFrench = String(v.prefix(WordBankLogic.maxFrench)) } }
    func wbSetEditEnglish(_ v: String) { updateWordBank { $0.editEnglish = String(v.prefix(WordBankLogic.maxEnglish)) } }
    func wbSetEditNote(_ v: String) { updateWordBank { $0.editNote = String(v.prefix(WordBankLogic.maxNote)) } }
    func wbAskDelete(_ id: String?) { updateWordBank { $0.confirmId = id } }
    func wbAskReset(_ confirming: Bool) { updateWordBank { $0.confirmReset = confirming } }
    func wbCancelEdit() { updateWordBank { $0.editingId = nil; $0.editError = nil } }

    func wbStartEdit(_ w: WordBankWord) {
        updateWordBank {
            $0.editingId = w.id
            $0.editFrench = w.french
            $0.editEnglish = w.english
            $0.editNote = w.note ?? ""
            $0.editError = nil
            $0.confirmId = nil
        }
    }

    /// The day the person is on in Anki, stamped on each word they add (1 if it can't be read).
    private func currentAnkiDay() async -> Int {
        guard let r = try? await authed({ try await self.api.readAppValue($0, key: "progress") }),
              case .found(let text) = r, let progress = StudyLogic.decode(text) else { return 1 }
        return clampDay(progress.current_day)
    }

    func wbAdd() {
        guard let w = wordBank, let words = w.words else { return }
        let visible = words.filter { !$0.hidden }
        let limit = WordBankLogic.ownLimit(tier)
        let limitMessage = "You've reached your limit of \(limit) words."
        var problem = WordBankLogic.validate(french: w.french, english: w.english, note: w.note)
        if problem == nil && !WordBankLogic.hasRoom(tier, visible) { problem = limitMessage }
        if problem == nil && WordBankLogic.isDuplicate(visible, french: w.french, english: w.english) { problem = "That word is already in your list." }
        if let problem {
            updateWordBank { $0.addError = problem; $0.notice = nil }
            return
        }
        updateWordBank { $0.busy = true; $0.addError = nil; $0.notice = nil }
        Task { [self] in
            do {
                let clean = WordBankLogic.clean(french: w.french, english: w.english, note: w.note)
                let day = await currentAnkiDay()
                let saved = try await authed { try await self.api.wordBankAdd($0, french: clean.french, english: clean.english, note: clean.note, addedDay: day) }
                updateWordBank { state in
                    state.words = (state.words ?? []) + [saved]
                    state.french = ""
                    state.english = ""
                    state.note = ""
                    state.busy = false
                    state.notice = "Added. It will appear in your Anki reviews from your next session."
                }
            } catch {
                let isLimit = (error as? APIError)?.message == "word_bank_limit"
                updateWordBank {
                    $0.busy = false
                    $0.addError = isLimit ? limitMessage : "Couldn't save that word. Try again."
                }
            }
        }
    }

    func wbSaveEdit(_ word: WordBankWord) {
        guard let w = wordBank, let words = w.words else { return }
        let visible = words.filter { !$0.hidden }
        var problem = WordBankLogic.validate(french: w.editFrench, english: w.editEnglish, note: w.editNote)
        if problem == nil && WordBankLogic.isDuplicate(visible, french: w.editFrench, english: w.editEnglish, ignoring: word.id) {
            problem = "That word is already in your list."
        }
        if let problem {
            updateWordBank { $0.editError = problem }
            return
        }
        updateWordBank { $0.busy = true }
        Task { [self] in
            do {
                let clean = WordBankLogic.clean(french: w.editFrench, english: w.editEnglish, note: w.editNote)
                let saved = try await authed { try await self.api.wordBankUpdate($0, id: word.id, french: clean.french, english: clean.english, note: clean.note) }
                updateWordBank { state in
                    state.words = state.words?.map { $0.id == word.id ? saved : $0 }
                    state.editingId = nil
                    state.busy = false
                }
            } catch {
                updateWordBank { $0.busy = false; $0.editError = "Couldn't save the change. Try again." }
            }
        }
    }

    func wbRemove(_ word: WordBankWord) {
        updateWordBank { $0.busy = true; $0.notice = nil }
        Task { [self] in
            do {
                try await authed { try await self.api.wordBankRemove($0, word: word) }
                updateWordBank { state in
                    if WordBankLogic.isOwn(word) {
                        state.words = state.words?.filter { $0.id != word.id }
                    } else {
                        state.words = state.words?.map { row in
                            var x = row
                            if x.id == word.id { x.hidden = true }
                            return x
                        }
                    }
                    state.confirmId = nil
                    state.busy = false
                }
            } catch {
                updateWordBank { $0.busy = false; $0.notice = "Couldn't remove that word. Try again." }
            }
        }
    }

    func wbReset() {
        updateWordBank { $0.busy = true; $0.notice = nil }
        Task { [self] in
            do {
                try await authed { try await self.api.wordBankResetStarter($0) }
                let words = try await authed { try await self.api.wordBankList($0) }
                updateWordBank { $0.words = words; $0.confirmReset = false; $0.busy = false; $0.notice = "Starter words restored." }
            } catch {
                updateWordBank { $0.busy = false; $0.notice = "Couldn't restore the starter words. Try again." }
            }
        }
    }

    /// Opens the admin page. Only super users get here; the database refuses everyone else anyway.
    func openAdmin() {
        guard tier == .superUser else { return }
        admin = AdminState()
        screen = .admin
        loadAdminUsers()
    }

    func loadAdminUsers() {
        updateAdmin { $0.loadError = nil }
        Task { [self] in
            do {
                let users = try await authed { try await self.api.adminListUsers($0) }
                updateAdmin { $0.users = users }
            } catch {
                updateAdmin {
                    $0.users = $0.users ?? []
                    $0.loadError = "Couldn't load users. " + error.localizedDescription
                }
            }
        }
    }

    func setAdminQuery(_ query: String) {
        updateAdmin { $0.query = query }
    }

    /// A tier was picked for someone. Making someone super asks first; every other change goes straight through.
    func requestTierChange(_ user: AdminUser, _ newTier: Tier) {
        if newTier == user.tier { return }
        if AdminLogic.needsConfirmation(newTier) {
            updateAdmin { $0.confirmSuper = user }
        } else {
            applyTier(user, newTier)
        }
    }

    func confirmPromotion() {
        guard let user = admin?.confirmSuper else { return }
        updateAdmin { $0.confirmSuper = nil }
        applyTier(user, .superUser)
    }

    func cancelPromotion() {
        updateAdmin { $0.confirmSuper = nil }
    }

    /// Saves the change; the list only updates once the database has accepted it (otherwise the old tier stays and the reason shows).
    private func applyTier(_ user: AdminUser, _ newTier: Tier) {
        updateAdmin {
            $0.saving.insert(user.userId)
            $0.rowErrors[user.userId] = nil
        }
        Task { [self] in
            do {
                try await authed { try await self.api.setUserTier($0, userId: user.userId, tier: newTier) }
                updateAdmin { a in
                    a.users = a.users?.map { u in
                        u.userId == user.userId
                            ? AdminUser(userId: u.userId, email: u.email, username: u.username, tier: newTier,
                                        createdAt: u.createdAt, lastSignInAt: u.lastSignInAt, feedbackUsed24h: u.feedbackUsed24h)
                            : u
                    }
                }
            } catch {
                updateAdmin { $0.rowErrors[user.userId] = error.localizedDescription }
            }
            updateAdmin { _ = $0.saving.remove(user.userId) }
        }
    }
}
