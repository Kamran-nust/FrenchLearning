import Foundation

/// Account tiers, lowest to highest. The tier itself lives in the database.
enum Tier: String {
    case free, premium
    case superUser = "super"

    var label: String {
        switch self {
        case .free: return "Free"
        case .premium: return "Premium"
        case .superUser: return "Super"
        }
    }

    /// Anything unknown counts as free (fail closed).
    static func from(_ value: String?) -> Tier {
        guard let value = value?.lowercased() else { return .free }
        return Tier(rawValue: value) ?? .free
    }
}

/// What reading one saved value found. Only `.empty` is safe to treat as "start fresh".
enum AppRead {
    case found(String)
    case empty
    case failed
}

struct Session: Equatable {
    let accessToken: String
    let refreshToken: String
    let userId: String
    let email: String
}

struct APIError: LocalizedError {
    let message: String
    let status: Int
    init(_ message: String, status: Int = 0) {
        self.message = message
        self.status = status
    }
    var errorDescription: String? { message }
}

/// A small client for the same Supabase backend the web app uses (email/password sign-in, the
/// username sign-in function, and the row-level-security protected tables). No secrets live
/// here: the key is the public publishable one.
struct SupabaseAPI {
    private let baseURL = Config.supabaseURL
    private let key = Config.supabaseKey

    private func call(_ method: String, _ path: String, token: String?, body: [String: Any]? = nil,
                      headers: [String: String] = [:]) async throws -> (status: Int, data: Data) {
        guard let url = URL(string: baseURL + path) else { throw APIError("Bad request.") }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(key, forHTTPHeaderField: "apikey")
        request.setValue("Bearer " + (token ?? key), forHTTPHeaderField: "Authorization")
        for (name, value) in headers { request.setValue(value, forHTTPHeaderField: name) }
        if method != "GET" {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body ?? [:])
        }
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            return ((response as? HTTPURLResponse)?.statusCode ?? 0, data)
        } catch {
            throw APIError("Couldn't reach the server. Check your connection.")
        }
    }

    private func object(_ data: Data) -> [String: Any] {
        ((try? JSONSerialization.jsonObject(with: data)) as? [String: Any]) ?? [:]
    }

    private func array(_ data: Data) -> [[String: Any]]? {
        (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]]
    }

    private func message(_ data: Data, fallback: String) -> String {
        let obj = object(data)
        for key in ["error_description", "msg", "message", "error"] {
            if let text = obj[key] as? String { return text }
        }
        return fallback
    }

    private func session(from obj: [String: Any]) throws -> Session {
        guard let access = obj["access_token"] as? String else { throw APIError("Sign-in failed.") }
        let user = obj["user"] as? [String: Any]
        return Session(
            accessToken: access,
            refreshToken: obj["refresh_token"] as? String ?? "",
            userId: user?["id"] as? String ?? "",
            email: user?["email"] as? String ?? ""
        )
    }

    func signIn(email: String, password: String) async throws -> Session {
        let reply = try await call("POST", "/auth/v1/token?grant_type=password", token: nil,
                                   body: ["email": email, "password": password])
        guard (200...299).contains(reply.status) else {
            throw APIError(message(reply.data, fallback: "Sign-in failed."), status: reply.status)
        }
        return try session(from: object(reply.data))
    }

    /// Username sign-in goes through the same `sign-in` Edge Function as the web app.
    func signIn(username: String, password: String) async throws -> Session {
        let reply = try await call("POST", "/functions/v1/sign-in", token: nil,
                                   body: ["username": username, "password": password])
        guard (200...299).contains(reply.status) else {
            throw APIError(message(reply.data, fallback: "Sign-in failed."), status: reply.status)
        }
        let obj = object(reply.data)
        guard let access = obj["access_token"] as? String else { throw APIError("Sign-in failed.") }
        return try await sessionFor(access: access, refresh: obj["refresh_token"] as? String ?? "")
    }

    private func sessionFor(access: String, refresh: String) async throws -> Session {
        let reply = try await call("GET", "/auth/v1/user", token: access)
        guard (200...299).contains(reply.status) else {
            throw APIError(message(reply.data, fallback: "Sign-in failed."), status: reply.status)
        }
        let user = object(reply.data)
        return Session(accessToken: access, refreshToken: refresh,
                       userId: user["id"] as? String ?? "", email: user["email"] as? String ?? "")
    }

    func refresh(_ refreshToken: String) async throws -> Session {
        let reply = try await call("POST", "/auth/v1/token?grant_type=refresh_token", token: nil,
                                   body: ["refresh_token": refreshToken])
        guard (200...299).contains(reply.status) else {
            throw APIError(message(reply.data, fallback: "Session expired."), status: reply.status)
        }
        return try session(from: object(reply.data))
    }

    /// Creates an account. The user must confirm their email before signing in.
    func signUp(email: String, password: String, username: String) async throws {
        let reply = try await call("POST", "/auth/v1/signup", token: nil,
                                   body: ["email": email, "password": password, "data": ["username": username]])
        guard (200...299).contains(reply.status) else {
            throw APIError(message(reply.data, fallback: "Couldn't create the account."), status: reply.status)
        }
    }

    func usernameAvailable(_ name: String) async throws -> Bool {
        let reply = try await call("POST", "/rest/v1/rpc/username_available", token: nil, body: ["name": name])
        let text = String(data: reply.data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
        return (200...299).contains(reply.status) && text == "true"
    }

    func tier(_ session: Session) async -> Tier {
        guard let reply = try? await call("GET", "/rest/v1/user_tiers?select=tier&user_id=eq.\(session.userId)", token: session.accessToken),
              (200...299).contains(reply.status) else { return .free }
        return Tier.from(array(reply.data)?.first?["tier"] as? String)
    }

    func username(_ session: Session) async -> String? {
        guard let reply = try? await call("GET", "/rest/v1/profiles?select=username&user_id=eq.\(session.userId)", token: session.accessToken),
              (200...299).contains(reply.status) else { return nil }
        return array(reply.data)?.first?["username"] as? String
    }

    /// Saved progress per storage key (key to the saved JSON text). Returns nil if the read failed,
    /// so callers never treat "couldn't read" as "nothing saved".
    func appState(_ session: Session, keys: [String]) async throws -> [String: String]? {
        let list = keys.joined(separator: ",")
        guard let reply = try? await call("GET", "/rest/v1/app_state?select=key,value&user_id=eq.\(session.userId)&key=in.(\(list))",
                                          token: session.accessToken) else { return nil }
        if reply.status == 401 { throw APIError("Session expired.", status: 401) }
        guard (200...299).contains(reply.status), let rows = array(reply.data) else { return nil }
        var out: [String: String] = [:]
        for row in rows {
            guard let key = row["key"] as? String else { continue }
            // The web app stores the progress JSON as a string inside the jsonb column.
            if let text = row["value"] as? String {
                out[key] = text
            } else if let value = row["value"], let data = try? JSONSerialization.data(withJSONObject: value),
                      let text = String(data: data, encoding: .utf8) {
                out[key] = text
            }
        }
        return out
    }

    /// Reads one saved value, telling "nothing saved yet" apart from "couldn't read it".
    func readAppValue(_ session: Session, key: String) async throws -> AppRead {
        guard let reply = try? await call("GET", "/rest/v1/app_state?select=value&user_id=eq.(session.userId)&key=eq.(key)",
                                          token: session.accessToken) else { return .failed }
        if reply.status == 401 { throw APIError("Session expired.", status: 401) }
        guard (200...299).contains(reply.status), let rows = array(reply.data) else { return .failed }
        guard let row = rows.first, let value = row["value"], !(value is NSNull) else { return .empty }
        if let text = value as? String { return .found(text) }
        if let data = try? JSONSerialization.data(withJSONObject: value), let text = String(data: data, encoding: .utf8) {
            return .found(text)
        }
        return .failed
    }

    /// Saves one value (the JSON text) for this user, replacing what was there. Throws if it couldn't be saved.
    func saveAppState(_ session: Session, key: String, jsonText: String) async throws {
        let reply = try await call(
            "POST", "/rest/v1/app_state?on_conflict=user_id,key", token: session.accessToken,
            body: ["user_id": session.userId, "key": key, "value": jsonText],   // the web app stores the progress JSON as a string
            headers: ["Prefer": "resolution=merge-duplicates,return=minimal"]
        )
        if reply.status == 401 { throw APIError("Session expired.", status: 401) }
        guard (200...299).contains(reply.status) else {
            throw APIError(message(reply.data, fallback: "Couldn't save."), status: reply.status)
        }
    }

    /// Where the person stands with today's AI feedback allowance; nil if it can't be read.
    func feedbackQuota(_ session: Session) async throws -> FeedbackQuota? {
        guard let reply = try? await call("POST", "/rest/v1/rpc/feedback_quota", token: session.accessToken, body: [:]) else { return nil }
        if reply.status == 401 { throw APIError("Session expired.", status: 401) }
        guard (200...299).contains(reply.status) else { return nil }
        return FeedbackParser.quota(try? JSONSerialization.jsonObject(with: reply.data))
    }

    /// Asks the AI for feedback on a draft (the same writing-feedback function the web app uses).
    func writingFeedback(_ session: Session, task: String, draft: String) async throws -> FeedbackOutcome {
        guard let reply = try? await call("POST", "/functions/v1/writing-feedback", token: session.accessToken,
                                          body: ["task": task, "draft": draft]) else { return .failed }
        if reply.status == 401 { throw APIError("Session expired.", status: 401) }
        return FeedbackParser.outcome(status: reply.status, body: reply.data)
    }

    /// French pronunciation for a word or phrase (an MP3), from the same text-to-speech function the web app uses. nil if unavailable.
    func textToSpeech(_ session: Session, text: String) async throws -> Data? {
        guard let reply = try? await call("POST", "/functions/v1/text-to-speech", token: session.accessToken, body: ["text": text]) else { return nil }
        if reply.status == 401 { throw APIError("Session expired.", status: 401) }
        guard (200...299).contains(reply.status),
              let obj = (try? JSONSerialization.jsonObject(with: reply.data)) as? [String: Any],
              let audio = obj["audioContent"] as? String else { return nil }
        return Data(base64Encoded: audio)
    }
}
