package com.frenchnclc7.app.data

import android.content.Context

/** Remembers the signed-in session and the chosen colour theme on this phone. */
class LocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("french_nclc7", Context.MODE_PRIVATE)

    fun saveSession(s: Session) {
        prefs.edit()
            .putString("access", s.accessToken)
            .putString("refresh", s.refreshToken)
            .putString("user_id", s.userId)
            .putString("email", s.email)
            .apply()
    }

    fun loadSession(): Session? {
        val access = prefs.getString("access", null) ?: return null
        return Session(
            access,
            prefs.getString("refresh", "") ?: "",
            prefs.getString("user_id", "") ?: "",
            prefs.getString("email", "") ?: "",
        )
    }

    fun clearSession() {
        prefs.edit().remove("access").remove("refresh").remove("user_id").remove("email").apply()
    }

    var themeId: String
        get() = prefs.getString("theme", "midnight") ?: "midnight"
        set(value) = prefs.edit().putString("theme", value).apply()
}
