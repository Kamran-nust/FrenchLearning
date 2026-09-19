import Foundation
import Security

/// Remembers the signed-in session (in the iOS Keychain, so tokens are stored securely)
/// and the chosen colour theme on this phone.
final class LocalStore {
    private let service = "com.frenchnclc7.app"

    var themeId: String {
        get { UserDefaults.standard.string(forKey: "theme") ?? Themes.defaultId }
        set { UserDefaults.standard.set(newValue, forKey: "theme") }
    }

    func saveSession(_ s: Session) {
        write("access", s.accessToken)
        write("refresh", s.refreshToken)
        write("user_id", s.userId)
        write("email", s.email)
    }

    func loadSession() -> Session? {
        guard let access = read("access") else { return nil }
        return Session(accessToken: access, refreshToken: read("refresh") ?? "",
                       userId: read("user_id") ?? "", email: read("email") ?? "")
    }

    func clearSession() {
        for key in ["access", "refresh", "user_id", "email"] { delete(key) }
    }

    // MARK: Keychain helpers

    private func query(_ key: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service,
         kSecAttrAccount as String: key]
    }

    private func write(_ key: String, _ value: String) {
        delete(key)
        var item = query(key)
        item[kSecValueData as String] = Data(value.utf8)
        SecItemAdd(item as CFDictionary, nil)
    }

    private func read(_ key: String) -> String? {
        var item = query(key)
        item[kSecReturnData as String] = true
        item[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: AnyObject?
        guard SecItemCopyMatching(item as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func delete(_ key: String) {
        SecItemDelete(query(key) as CFDictionary)
    }
}
