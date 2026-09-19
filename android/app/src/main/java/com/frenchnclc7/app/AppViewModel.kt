package com.frenchnclc7.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.frenchnclc7.app.data.ApiException
import com.frenchnclc7.app.data.AppRead
import com.frenchnclc7.app.data.LocalStore
import com.frenchnclc7.app.data.PlanRepository
import com.frenchnclc7.app.data.PlanSection
import com.frenchnclc7.app.data.Progress
import com.frenchnclc7.app.data.ProgressLogic
import com.frenchnclc7.app.data.SectionProgress
import com.frenchnclc7.app.data.Session
import com.frenchnclc7.app.data.SupabaseApi
import com.frenchnclc7.app.data.TOTAL_DAYS
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
    /** Read-only view of a day (used for Anki until its flashcard sessions are built). */
    data class Day(val section: PlanSection, val day: Int) : Screen
    /** The day-by-day study screen with "Mark day complete" and streaks. */
    data object Study : Screen
}

enum class StudyPhase { DAY, COMPLETE, FINISHED }

/** The day just completed, for the "Day N done" screen. */
data class CompletionInfo(val day: Int, val remaining: Int, val streak: Int)

data class StudyState(
    val section: PlanSection,
    val loading: Boolean = true,
    val progress: SectionProgress = SectionProgress(),
    /** The saved progress couldn't be read: saving is switched off so it can never be overwritten. */
    val loadFailed: Boolean = false,
    /** A save didn't go through. */
    val saveFailed: Boolean = false,
    val viewDay: Int = 1,
    val phase: StudyPhase = StudyPhase.DAY,
    val completion: CompletionInfo? = null,
    val confirmingReset: Boolean = false,
)

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
    val study: StudyState? = null,
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

    /** Runs a server call with the current session, refreshing the sign-in once if it has expired. */
    private suspend fun <T> authed(block: suspend (Session) -> T): T {
        var s = _state.value.session ?: throw ApiException("Not signed in.", 401)
        try {
            return block(s)
        } catch (e: ApiException) {
            if (e.status == 401 && s.refreshToken.isNotEmpty()) {
                s = api.refresh(s.refreshToken)
                store.saveSession(s)
                _state.update { it.copy(session = s) }
                return block(s)
            }
            throw e
        }
    }

    /** Signed in: load who they are, their tier and their overall progress, then show Home. */
    private fun enter(session: Session) {
        viewModelScope.launch {
            _state.update { it.copy(session = session) }
            try {
                val (name, tier, through) = authed { s ->
                    Triple(api.username(s), api.tier(s), overallProgress(s))
                }
                _state.update {
                    it.copy(screen = Screen.Home, username = name, tier = tier, completedThrough = through, authError = null)
                }
            } catch (e: ApiException) {
                if (e.status == 401) {
                    // The saved sign-in is no longer valid.
                    store.clearSession()
                    _state.update { it.copy(screen = Screen.Auth, session = null, authError = "Please sign in again.") }
                } else {
                    // Offline or a server hiccup: stay signed in, show Home without the extras.
                    _state.update { it.copy(screen = Screen.Home, authError = null) }
                }
            }
        }
    }

    private suspend fun overallProgress(s: Session): Int? {
        val saved = api.appState(s, PlanSection.entries.map { it.storageKey }) ?: return null
        return Progress.fullyCompletedThrough(PlanSection.entries.map { Progress.completedDays(saved[it.storageKey]) })
    }

    /** Re-reads the overall "Day N complete" number (after studying, for example). */
    private fun refreshOverview() {
        viewModelScope.launch {
            try {
                val through = authed { overallProgress(it) }
                _state.update { it.copy(completedThrough = through) }
            } catch (e: ApiException) {
                // Keep showing the previous number if this can't be refreshed.
            }
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

    // ---- Navigation -------------------------------------------------------------------------

    /** Opens a section on a day. Grammar, Kwiziq, TV5MONDE and Writing use the study screen; Anki the read-only viewer. */
    fun open(section: PlanSection, day: Int? = null) {
        if (section == PlanSection.ANKI) {
            _state.update { it.copy(screen = Screen.Day(section, day ?: 1), study = null) }
            return
        }
        val current = _state.value.study
        if (current != null && current.section == section && !current.loading) {
            // Already loaded (switching days inside the same section): just move.
            _state.update {
                it.copy(screen = Screen.Study, study = current.copy(viewDay = (day ?: current.viewDay).coerceIn(1, TOTAL_DAYS), phase = StudyPhase.DAY))
            }
        } else {
            openStudy(section, day)
        }
    }

    /** Home. Also re-reads the overall progress so "Day N complete" reflects what was just done. */
    fun home() {
        val hadStudy = _state.value.study != null
        _state.update { it.copy(screen = Screen.Home, study = null) }
        if (hadStudy) refreshOverview()
    }

    // ---- Study (Grammar, Kwiziq, TV5MONDE, Writing) ------------------------------------------

    private fun openStudy(section: PlanSection, startDay: Int?) {
        _state.update { it.copy(screen = Screen.Study, study = StudyState(section)) }
        viewModelScope.launch {
            try {
                val read = authed { api.readAppValue(it, section.storageKey) }
                var failed = false
                val progress = when (read) {
                    AppRead.Empty -> SectionProgress()
                    AppRead.Failed -> { failed = true; SectionProgress() }
                    is AppRead.Found -> ProgressLogic.decode(read.text) ?: run { failed = true; SectionProgress() }
                }
                updateStudy(section) {
                    it.copy(
                        loading = false, progress = progress, loadFailed = failed,
                        viewDay = (startDay ?: progress.current_day).coerceIn(1, TOTAL_DAYS),
                    )
                }
            } catch (e: ApiException) {
                // Couldn't read: never treat that as "nothing saved" (saving stays off).
                updateStudy(section) {
                    it.copy(loading = false, loadFailed = true, viewDay = (startDay ?: 1).coerceIn(1, TOTAL_DAYS))
                }
            }
        }
    }

    private fun updateStudy(section: PlanSection, change: (StudyState) -> StudyState) {
        _state.update { ui ->
            val s = ui.study
            if (s == null || s.section != section) ui else ui.copy(study = change(s))
        }
    }

    private fun editStudy(change: (StudyState) -> StudyState) {
        _state.update { ui -> ui.study?.let { ui.copy(study = change(it)) } ?: ui }
    }

    fun studyMove(delta: Int) = editStudy { it.copy(viewDay = (it.viewDay + delta).coerceIn(1, TOTAL_DAYS)) }

    /** Saves progress unless the load failed (in which case the real saved progress must not be overwritten). */
    private fun persist(section: PlanSection, progress: SectionProgress) {
        val study = _state.value.study
        if (study == null || study.loadFailed) return
        viewModelScope.launch {
            try {
                authed { api.saveAppState(it, section.storageKey, ProgressLogic.encode(progress)) }
                updateStudy(section) { it.copy(saveFailed = false) }
            } catch (e: ApiException) {
                updateStudy(section) { it.copy(saveFailed = true) }
            }
        }
    }

    fun completeDay() {
        val study = _state.value.study ?: return
        val pending = study.viewDay == study.progress.current_day && study.progress.current_day <= TOTAL_DAYS
        if (study.loading || !pending) return
        val done = ProgressLogic.completeDay(study.progress, study.viewDay)
        val next = done.progress
        editStudy {
            it.copy(
                progress = next,
                completion = CompletionInfo(study.viewDay, TOTAL_DAYS - next.completed_days.size, done.streak),
                phase = if (next.current_day > TOTAL_DAYS) StudyPhase.FINISHED else StudyPhase.COMPLETE,
            )
        }
        persist(study.section, next)
    }

    fun continueNext() = editStudy {
        if (it.progress.current_day > TOTAL_DAYS) it.copy(phase = StudyPhase.FINISHED)
        else it.copy(viewDay = it.progress.current_day, phase = StudyPhase.DAY)
    }

    fun askReset(confirming: Boolean) = editStudy { it.copy(confirmingReset = confirming) }

    fun doReset() {
        val study = _state.value.study ?: return
        val fresh = SectionProgress()
        editStudy { it.copy(progress = fresh, confirmingReset = false, viewDay = 1, phase = StudyPhase.DAY, completion = null) }
        persist(study.section, fresh)
    }
}
