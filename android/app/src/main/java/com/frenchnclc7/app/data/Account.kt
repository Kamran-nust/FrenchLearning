package com.frenchnclc7.app.data

/** The rules for account deletion and password reset that need no screen or network (same as the web app). */
object AccountLogic {
    /** The word a person types to confirm deleting their account. */
    const val DELETE_WORD = "DELETE"

    fun canConfirmDelete(typedWord: String, password: String): Boolean =
        typedWord.trim() == DELETE_WORD && password.isNotEmpty()

    /** Super accounts can't be deleted from the app (the server refuses them too). */
    fun canDelete(tier: Tier): Boolean = tier != Tier.SUPER

    fun isEmail(text: String): Boolean = text.trim().let { it.contains("@") && it.length >= 3 && !it.contains(" ") }

    /** What the person is told after asking for a reset link; it says nothing about whether the account exists. */
    fun resetSentMessage(email: String): String =
        "If an account exists for ${email.trim()}, we've sent a link. Open it to choose a new password, then sign in here."

    const val WRONG_PASSWORD = "That password isn't right."
    const val SUPER_NOT_ALLOWED = "Super accounts can't be deleted here."
    const val DELETE_FAILED = "Couldn't delete the account. Try again in a moment."
}
