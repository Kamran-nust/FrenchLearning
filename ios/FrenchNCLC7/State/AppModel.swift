import Foundation
import SwiftUI

/// Where the user is.
enum Screen: Equatable {
    case loading
    case auth
    case home
    case day(PlanSection, Int)
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

    let plan = PlanRepository()
    private let api = SupabaseAPI()
    private let store = LocalStore()

    var colors: AppColors { Themes.get(themeId) }

    init() {
        themeId = store.themeId
        if let saved = store.loadSession() {
            Task { await enter(saved) }
        } else {
            screen = .auth
        }
    }

    /// Signed in: load who they are, their tier and their overall progress, then show Home.
    private func enter(_ start: Session) async {
        var s = start
        do {
            do {
                try await loadAccount(s)
            } catch let error as APIError where error.status == 401 && !s.refreshToken.isEmpty {
                // Expired access token: refresh once, then try again.
                s = try await api.refresh(s.refreshToken)
                store.saveSession(s)
                try await loadAccount(s)
            }
        } catch let error as APIError where error.status == 401 {
            // The saved sign-in is no longer valid.
            store.clearSession()
            session = nil
            authError = "Please sign in again."
            screen = .auth
        } catch {
            // Offline or a server hiccup: stay signed in, show Home without the extras.
            session = s
            authError = nil
            screen = .home
        }
    }

    private func loadAccount(_ s: Session) async throws {
        let saved = try await api.appState(s, keys: PlanSection.allCases.map { $0.storageKey })
        var through: Int?
        if let saved {
            through = PlanProgress.fullyCompletedThrough(
                PlanSection.allCases.map { PlanProgress.completedDays(saved[$0.storageKey]) }
            )
        }
        let loadedTier = await api.tier(s)
        let name = await api.username(s)
        session = s
        tier = loadedTier
        username = name
        completedThrough = through
        authError = nil
        screen = .home
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
        Task {
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
            Task {
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
        authError = nil
        authNotice = nil
        screen = .auth
    }

    func setTheme(_ id: String) {
        store.themeId = id
        themeId = id
    }

    func open(_ section: PlanSection, day: Int) { screen = .day(section, day) }
    func goHome() { screen = .home }
}
