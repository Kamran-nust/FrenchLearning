import Foundation

/// The rules for account deletion and password reset that need no screen or network (same as the web app).
enum AccountLogic {
    /// The word a person types to confirm deleting their account.
    static let deleteWord = "DELETE"

    static func canConfirmDelete(typed: String, password: String) -> Bool {
        typed.trimmingCharacters(in: .whitespaces) == deleteWord && !password.isEmpty
    }

    /// Super accounts can't be deleted from the app (the server refuses them too).
    static func canDelete(_ tier: Tier) -> Bool { tier != .superUser }

    static func isEmail(_ text: String) -> Bool {
        let t = text.trimmingCharacters(in: .whitespaces)
        return t.contains("@") && t.count >= 3 && !t.contains(" ")
    }

    /// What the person is told after asking for a reset link; it says nothing about whether the account exists.
    static func resetSentMessage(_ email: String) -> String {
        "If an account exists for \(email.trimmingCharacters(in: .whitespaces)), we've sent a link. Open it to choose a new password, then sign in here."
    }

    static let wrongPassword = "That password isn't right."
    static let superNotAllowed = "Super accounts can't be deleted here."
    static let deleteFailed = "Couldn't delete the account. Try again in a moment."
}
