package com.frenchnclc7.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.frenchnclc7.app.data.ApiException
import com.frenchnclc7.app.data.LocalStore
import com.frenchnclc7.app.data.PlanRepository
import com.frenchnclc7.app.data.PlanSection
import com.frenchnclc7.app.data.Progress
import com.frenchnclc7.app.data.Session
import com.frenchnclc7.app.data.SupabaseApi
import com.frenchnclc7.app.data.Tier
import com.frenchnclc7.app.ui.Themes
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/** Where the user is. */
sealed interface Screen {
    data object Loading : Screen
    data object Auth : Screen
    data object Home : Screen
    data class Day(val section: PlanSection, val day: Int) : Screen
}

data class UiState(
    val screen: Screen = Screen.Loading,
    val session: Session? = null,
    val username: String? = null,
    val tier: Tier = Tier.FREE,
    val themeId: String = Themes.DEFAULT,
    /** Highest day fully completed in every section; null while loading or if it couldn't be read. */
    val completedThrough: Int? = null,
    val authBusy: Boolean = false,
    val authError: String? = null,
    val authNotice: String? = null,
)

class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val api = SupabaseApi()
    private val store = LocalStore(app)
    val plan = PlanRepository(app)

    private val _state = MutableStateFlow(UiState(themeId = store.themeId))
    val state: StateFlow<UiState> = _state.asStateFlow()

    init {
        val saved = store.loadSession()
        if (saved == null) _state.update { it.copy(screen = Screen.Auth) } else enter(saved)
    }

    /** Signed in: load who they are, their tier and their overall progress, then show Home. */
    private fun enter(session: Session) {
        viewModelScope.launch {
            var s = session
            try {
                var attempt = 0
                while (true) {
                    try {
                        loadAccount(s)
                        break
                    } catch (e: ApiException) {
                        // Expired access token: refresh once, then try again.
                        if (e.status == 401 && attempt == 0 && s.refreshToken.isNotEmpty()) {
                            s = api.refresh(s.refreshToken)
                            store.saveSession(s)
                            attempt++
                        } else throw e
                    }
                }
            } catch (e: ApiException) {
                if (e.status == 401) {
                    // The saved sign-in is no longer valid.
                    store.clearSession()
                    _state.update { it.copy(screen = Screen.Auth, session = null, authError = "Please sign in again.") }
                } else {
                    // Offline or a server hiccup: stay signed in, show Home without the extras.
                    _state.update { it.copy(screen = Screen.Home, session = s, authError = null) }
                }
            }
        }
    }

    private suspend fun loadAccount(s: Session) {
        val progress = api.appState(s, PlanSection.entries.map { it.storageKey })
        val through = progress?.let { saved ->
            Progress.fullyCompletedThrough(PlanSection.entries.map { Progress.completedDays(saved[it.storageKey]) })
        }
        val tier = api.tier(s)
        val name = api.username(s)
        _state.update {
            it.copy(screen = Screen.Home, session = s, tier = tier, username = name, completedThrough = through, authError = null)
        }
    }

    fun signIn(useUsername: Boolean, who: String, password: String) {
        if (who.isBlank() || password.isEmpty()) {
            _state.update { it.copy(authError = "Enter your " + (if (useUsername) "username" else "email") + " and password.") }
            return
        }
        _state.update { it.copy(authBusy = true, authError = null, authNotice = null) }
        viewModelScope.launch {
            try {
                val s = if (useUsername) api.signInWithUsername(who.trim(), password) else api.signInWithEmail(who.trim(), password)
                store.saveSession(s)
                _state.update { it.copy(authBusy = false) }
                enter(s)
            } catch (e: ApiException) {
                _state.update { it.copy(authBusy = false, authError = e.message) }
            }
        }
    }

    fun signUp(email: String, username: String, password: String) {
        val nameOk = Regex("^[A-Za-z0-9_]{3,20}$").matches(username.trim())
        when {
            !nameOk -> _state.update { it.copy(authError = "Username must be 3-20 letters, numbers or underscores.") }
            !email.contains("@") -> _state.update { it.copy(authError = "Enter a valid email address.") }
            password.length < 6 -> _state.update { it.copy(authError = "Password must be at least 6 characters.") }
            else -> {
                _state.update { it.copy(authBusy = true, authError = null, authNotice = null) }
                viewModelScope.launch {
                    try {
                        if (!api.usernameAvailable(username.trim())) {
                            _state.update { it.copy(authBusy = false, authError = "That username is taken.") }
                            return@launch
                        }
                        api.signUp(email.trim(), password, username.trim())
                        _state.update {
                            it.copy(authBusy = false, authNotice = "Account created. Check your email to confirm it, then sign in.")
                        }
                    } catch (e: ApiException) {
                        _state.update { it.copy(authBusy = false, authError = e.message) }
                    }
                }
            }
        }
    }

    fun clearAuthMessages() = _state.update { it.copy(authError = null, authNotice = null) }

    fun signOut() {
        store.clearSession()
        _state.update { UiState(screen = Screen.Auth, themeId = it.themeId) }
    }

    fun setTheme(id: String) {
        store.themeId = id
        _state.update { it.copy(themeId = id) }
    }

    fun open(section: PlanSection, day: Int) = _state.update { it.copy(screen = Screen.Day(section, day)) }
    fun home() = _state.update { it.copy(screen = Screen.Home) }
}
