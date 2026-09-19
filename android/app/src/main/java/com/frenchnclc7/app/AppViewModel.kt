package com.frenchnclc7.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.frenchnclc7.app.data.AnkiLogic
import com.frenchnclc7.app.data.AnkiSession
import com.frenchnclc7.app.data.ApiException
import com.frenchnclc7.app.data.CardStat
import com.frenchnclc7.app.data.SpeechPlayer
import com.frenchnclc7.app.data.AppRead
import com.frenchnclc7.app.data.BookChapters
import com.frenchnclc7.app.data.DayPlanLogic
import com.frenchnclc7.app.data.DayPlanPdf
import com.frenchnclc7.app.data.PdfQuota
import com.frenchnclc7.app.data.GrammarPagesResult
import com.frenchnclc7.app.data.LessonLinkLogic
import com.frenchnclc7.app.data.LessonLinks
import com.frenchnclc7.app.data.FeedbackOutcome
import com.frenchnclc7.app.data.FeedbackQuota
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
import com.frenchnclc7.app.data.WritingEntry
import com.frenchnclc7.app.data.WritingLogic
import com.frenchnclc7.app.ui.Themes
import android.net.Uri
import java.io.File
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.withContext
import kotlinx.coroutines.delay
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
    /** The Writing section: editor, AI feedback, mark day complete. */
    data object Writing : Screen
    /** The Anki flashcards. */
    data object Anki : Screen
}

enum class StudyPhase { DAY, COMPLETE, FINISHED }

/** The day just completed, for the "Day N done" screen. */
data class CompletionInfo(val day: Int, val remaining: Int, val streak: Int)

/** A grammar PDF being read in the app. */
data class PdfViewer(val label: String, val path: String)

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
    /** Grammar chapter PDFs: a request is running / it failed / one is open for reading. */
    val pdfLoading: Boolean = false,
    val pdfError: String? = null,
    val pdfViewer: PdfViewer? = null,
    /** Direct lesson links (Kwiziq / TV5MONDE, premium and super). Empty for everyone else. */
    val lessonLinks: LessonLinks = LessonLinks.EMPTY,
)

enum class SaveState { IDLE, SAVING, SAVED }

enum class FeedbackUi { IDLE, LOADING, BUSY, FAILED }

data class WritingState(
    val loading: Boolean = true,
    val progress: SectionProgress = SectionProgress(),
    /** What was written (and the AI's feedback) for each day. */
    val entries: Map<Int, WritingEntry> = emptyMap(),
    /** Saved progress or writing couldn't be read: saving is switched off so it can never be overwritten. */
    val loadFailed: Boolean = false,
    val saveFailed: Boolean = false,
    val viewDay: Int = 1,
    val phase: StudyPhase = StudyPhase.DAY,
    val completion: CompletionInfo? = null,
    val confirmingReset: Boolean = false,
    val saveState: SaveState = SaveState.IDLE,
    val feedback: FeedbackUi = FeedbackUi.IDLE,
    /** Today's AI feedback allowance; null until loaded. */
    val quota: FeedbackQuota? = null,
    /** Goes up on every reset, so the text box starts empty again. */
    val resetCount: Int = 0,
)

data class AnkiState(
    val loading: Boolean = true,
    val progress: SectionProgress = SectionProgress(),
    /** Cards marked "hard" (they come up more often in review). */
    val hard: Set<String> = emptySet(),
    val stats: Map<String, CardStat> = emptyMap(),
    val session: AnkiSession? = null,
    val index: Int = 0,
    val revealed: Boolean = false,
    /** DAY = a session is running. */
    val phase: StudyPhase = StudyPhase.DAY,
    val completion: CompletionInfo? = null,
    /** A bonus round for a chosen day: nothing about progress, streak or stats changes. */
    val practice: Boolean = false,
    /** Saved progress couldn't be read: saving is switched off so it can never be overwritten. */
    val loadFailed: Boolean = false,
    val saveFailed: Boolean = false,
    val confirmingReset: Boolean = false,
)

/** A finished day-plan PDF waiting to be saved to a place the user picks. */
class PdfReady(val fileName: String, val bytes: ByteArray, val claimId: Long)

data class DayPlanState(
    /** Whether another download is allowed right now; null until known. */
    val quota: PdfQuota? = null,
    val busy: Boolean = false,
    val error: String? = null,
    val ready: PdfReady? = null,
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
    val writing: WritingState? = null,
    val anki: AnkiState? = null,
    val dayPlan: DayPlanState = DayPlanState(),
)

class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val api = SupabaseApi()
    private val store = LocalStore(app)
    val plan = PlanRepository(app)
    private val speech = SpeechPlayer(app)
    private val cacheDir = app.cacheDir
    private val resolver = app.contentResolver

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
        stopSpeech()
        store.clearSession()
        _state.update { UiState(screen = Screen.Auth, themeId = it.themeId) }
    }

    fun setTheme(id: String) {
        store.themeId = id
        _state.update { it.copy(themeId = id) }
    }

    // ---- Navigation -------------------------------------------------------------------------

    /** Opens a section on a day. Grammar, Kwiziq, TV5MONDE and Writing use the study screen; Anki the read-only viewer. */
    /** The read-only day viewer (Home's "Jump to a day"). */
    fun browseDay(day: Int) {
        flushWriting()
        stopSpeech()
        _state.update { it.copy(screen = Screen.Day(PlanSection.ANKI, day.coerceIn(1, TOTAL_DAYS)), study = null, writing = null, anki = null) }
    }

    fun open(section: PlanSection, day: Int? = null) {
        if (section == PlanSection.ANKI) {
            flushWriting()
            openAnki(day)
            return
        }
        if (section == PlanSection.WRITING) {
            openWriting(day)
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
        val hadStudy = _state.value.study != null || _state.value.writing != null || _state.value.anki != null
        flushWriting()
        stopSpeech()
        _state.update { it.copy(screen = Screen.Home, study = null, writing = null, anki = null) }
        if (hadStudy) refreshOverview()
    }

    // ---- Study (Grammar, Kwiziq, TV5MONDE, Writing) ------------------------------------------

    private fun openStudy(section: PlanSection, startDay: Int?) {
        _state.update { it.copy(screen = Screen.Study, study = StudyState(section)) }
        // Direct lesson links: only premium and super ask for them (free accounts keep the Google searches).
        val linkModule = LessonLinkLogic.moduleFor(section)
        if (linkModule != null && _state.value.tier.atLeast(Tier.PREMIUM)) {
            viewModelScope.launch {
                val links = try { authed { api.lessonLinks(it, linkModule) } } catch (e: ApiException) { LessonLinks.EMPTY }
                updateStudy(section) { it.copy(lessonLinks = links) }
            }
        }
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

    // ---- Writing ------------------------------------------------------------------------------

    private var writingSaveJob: Job? = null
    private var writingLoadFailed = false

    private fun updateWriting(change: (WritingState) -> WritingState) {
        _state.update { ui -> ui.writing?.let { ui.copy(writing = change(it)) } ?: ui }
    }

    private fun writingTask(day: Int): String = plan.days(PlanSection.WRITING).first { it.day == day }.text

    private fun openWriting(startDay: Int?) {
        val alreadyOpen = _state.value.writing
        if (alreadyOpen != null && !alreadyOpen.loading) {
            // Switching days inside Writing: keep what is loaded.
            switchWritingDay((startDay ?: alreadyOpen.viewDay).coerceIn(1, TOTAL_DAYS), keepPhase = false)
            _state.update { it.copy(screen = Screen.Writing) }
            return
        }
        writingLoadFailed = false
        _state.update { it.copy(screen = Screen.Writing, study = null, writing = WritingState()) }
        viewModelScope.launch { // the AI allowance loads alongside, without holding up the screen
            val quota = try { authed { api.feedbackQuota(it) } } catch (e: ApiException) { null }
            updateWriting { it.copy(quota = quota) }
        }
        viewModelScope.launch {
            try {
                val (readProgress, readEntries) = authed { s ->
                    Pair(api.readAppValue(s, PlanSection.WRITING.storageKey), api.readAppValue(s, "writing-entries"))
                }
                var failed = false
                val progress = when (readProgress) {
                    AppRead.Empty -> SectionProgress()
                    AppRead.Failed -> { failed = true; SectionProgress() }
                    is AppRead.Found -> ProgressLogic.decode(readProgress.text) ?: run { failed = true; SectionProgress() }
                }
                val entries = when (readEntries) {
                    AppRead.Empty -> emptyMap()
                    AppRead.Failed -> { failed = true; emptyMap() }
                    is AppRead.Found -> WritingLogic.decodeEntries(readEntries.text) ?: run { failed = true; emptyMap() }
                }
                writingLoadFailed = failed
                updateWriting {
                    it.copy(
                        loading = false, progress = progress, entries = entries, loadFailed = failed,
                        viewDay = (startDay ?: progress.current_day).coerceIn(1, TOTAL_DAYS),
                    )
                }
            } catch (e: ApiException) {
                // Couldn't read: never treat that as "nothing saved" (saving stays off).
                writingLoadFailed = true
                updateWriting { it.copy(loading = false, loadFailed = true, viewDay = (startDay ?: 1).coerceIn(1, TOTAL_DAYS)) }
            }
        }
    }

    /** Saves one Writing value unless the load failed (in which case what is saved must not be overwritten). */
    private fun persistWriting(key: String, jsonText: String) {
        if (writingLoadFailed) return
        viewModelScope.launch {
            try {
                authed { api.saveAppState(it, key, jsonText) }
                updateWriting { it.copy(saveFailed = false) }
            } catch (e: ApiException) {
                updateWriting { it.copy(saveFailed = true) }
            }
        }
    }

    /** If a typing-pause save is waiting, do it now (before switching day, completing, or leaving). */
    private fun flushWriting() {
        val job = writingSaveJob
        if (job != null && job.isActive) {
            job.cancel()
            _state.value.writing?.let { persistWriting("writing-entries", WritingLogic.encodeEntries(it.entries)) }
            updateWriting { it.copy(saveState = SaveState.SAVED) }
        }
        writingSaveJob = null
    }

    /** Called on every change to the text box. The text is saved a second after typing stops. */
    fun writingDraftChanged(text: String) {
        val w = _state.value.writing ?: return
        if (w.loading) return
        val day = w.viewDay
        val entries = w.entries + (day to (w.entries[day] ?: WritingEntry()).copy(text = text))
        updateWriting { it.copy(entries = entries, saveState = SaveState.SAVING) }
        writingSaveJob?.cancel()
        writingSaveJob = viewModelScope.launch {
            delay(1000)
            _state.value.writing?.let { persistWriting("writing-entries", WritingLogic.encodeEntries(it.entries)) }
            updateWriting { it.copy(saveState = SaveState.SAVED) }
            writingSaveJob = null
        }
    }

    private fun switchWritingDay(day: Int, keepPhase: Boolean) {
        flushWriting()
        updateWriting {
            it.copy(viewDay = day, saveState = SaveState.IDLE, feedback = FeedbackUi.IDLE, phase = if (keepPhase) it.phase else StudyPhase.DAY)
        }
    }

    fun writingMove(delta: Int) {
        val w = _state.value.writing ?: return
        val next = (w.viewDay + delta).coerceIn(1, TOTAL_DAYS)
        if (next != w.viewDay) switchWritingDay(next, keepPhase = true)
    }

    /** Asks the AI for feedback on today's draft. Only a successful reply uses up the allowance. */
    fun getWritingFeedback() {
        val w = _state.value.writing ?: return
        val day = w.viewDay
        val draft = w.entries[day]?.text ?: return
        if (draft.isBlank() || w.feedback == FeedbackUi.LOADING || w.quota?.limitReached() == true) return
        updateWriting { it.copy(feedback = FeedbackUi.LOADING) }
        viewModelScope.launch {
            val outcome = try {
                authed { api.writingFeedback(it, writingTask(day), draft) }
            } catch (e: ApiException) {
                FeedbackOutcome.Failed
            }
            when (outcome) {
                is FeedbackOutcome.Success -> {
                    var saved = ""
                    updateWriting { cur ->
                        val entries = cur.entries + (day to (cur.entries[day] ?: WritingEntry()).copy(text = draft, feedback = outcome.text))
                        saved = WritingLogic.encodeEntries(entries)
                        cur.copy(entries = entries, quota = outcome.quota ?: cur.quota, feedback = FeedbackUi.IDLE)
                    }
                    if (saved.isNotEmpty()) persistWriting("writing-entries", saved)
                }
                // The limit line under the button explains it; no separate error is needed.
                is FeedbackOutcome.LimitReached -> updateWriting { it.copy(quota = outcome.quota ?: it.quota, feedback = FeedbackUi.IDLE) }
                FeedbackOutcome.Busy -> updateWriting { it.copy(feedback = FeedbackUi.BUSY) }
                FeedbackOutcome.Failed -> updateWriting { it.copy(feedback = FeedbackUi.FAILED) }
            }
        }
    }

    fun completeWritingDay() {
        val w = _state.value.writing ?: return
        val pending = w.viewDay == w.progress.current_day && w.progress.current_day <= TOTAL_DAYS
        if (w.loading || !pending) return
        flushWriting()
        val done = ProgressLogic.completeDay(w.progress, w.viewDay)
        val next = done.progress
        updateWriting {
            it.copy(
                progress = next,
                completion = CompletionInfo(w.viewDay, TOTAL_DAYS - next.completed_days.size, done.streak),
                phase = if (next.current_day > TOTAL_DAYS) StudyPhase.FINISHED else StudyPhase.COMPLETE,
            )
        }
        persistWriting(PlanSection.WRITING.storageKey, ProgressLogic.encode(next))
    }

    fun continueWriting() {
        val w = _state.value.writing ?: return
        if (w.progress.current_day > TOTAL_DAYS) updateWriting { it.copy(phase = StudyPhase.FINISHED) }
        else switchWritingDay(w.progress.current_day, keepPhase = false)
    }

    fun askWritingReset(confirming: Boolean) = updateWriting { it.copy(confirmingReset = confirming) }

    fun doWritingReset() {
        _state.value.writing ?: return
        flushWriting()
        val fresh = SectionProgress()
        updateWriting {
            it.copy(progress = fresh, entries = emptyMap(), confirmingReset = false, viewDay = 1, phase = StudyPhase.DAY,
                completion = null, saveState = SaveState.IDLE, feedback = FeedbackUi.IDLE, resetCount = it.resetCount + 1)
        }
        persistWriting(PlanSection.WRITING.storageKey, ProgressLogic.encode(fresh))
        persistWriting("writing-entries", WritingLogic.encodeEntries(emptyMap()))
    }

    // ---- Anki flashcards ------------------------------------------------------------------------

    private var ankiLoadFailed = false
    private var speakJob: Job? = null

    private fun updateAnki(change: (AnkiState) -> AnkiState) {
        _state.update { ui -> ui.anki?.let { ui.copy(anki = change(it)) } ?: ui }
    }

    private fun ankiDays() = plan.days(PlanSection.ANKI)

    private fun buildAnkiSession(day: Int, progress: SectionProgress, hard: Set<String>): AnkiSession? =
        AnkiLogic.buildSession(ankiDays(), day, progress.completed_days.size, hard)

    /**
     * Opens the flashcards. With no [practiceDay] it is today's real session; with one it is a bonus
     * practice round for that day (no progress, streak or stats change).
     */
    private fun openAnki(practiceDay: Int?) {
        ankiLoadFailed = false
        stopSpeech()
        _state.update { it.copy(screen = Screen.Anki, study = null, writing = null, anki = AnkiState()) }
        viewModelScope.launch {
            try {
                val reads = authed { s ->
                    Triple(api.readAppValue(s, "progress"), api.readAppValue(s, "hard-words"), api.readAppValue(s, "card-stats"))
                }
                var failed = false
                val progress = when (val r = reads.first) {
                    AppRead.Empty -> SectionProgress()
                    AppRead.Failed -> { failed = true; SectionProgress() }
                    is AppRead.Found -> ProgressLogic.decode(r.text) ?: run { failed = true; SectionProgress() }
                }
                val hard: Set<String> = when (val r = reads.second) {
                    AppRead.Empty -> emptySet()
                    AppRead.Failed -> { failed = true; emptySet() }
                    is AppRead.Found -> AnkiLogic.decodeHard(r.text) ?: run { failed = true; emptySet() }
                }
                val stats: Map<String, CardStat> = when (val r = reads.third) {
                    AppRead.Empty -> emptyMap()
                    AppRead.Failed -> { failed = true; emptyMap() }
                    is AppRead.Found -> AnkiLogic.decodeStats(r.text) ?: run { failed = true; emptyMap() }
                }
                ankiLoadFailed = failed
                val practice = practiceDay != null
                val finished = !practice && progress.current_day > TOTAL_DAYS
                val session = when {
                    practice -> buildAnkiSession(practiceDay!!.coerceIn(1, TOTAL_DAYS), progress, hard)
                    finished -> null
                    else -> buildAnkiSession(progress.current_day, progress, hard)
                }
                updateAnki {
                    it.copy(
                        loading = false, progress = progress, hard = hard, stats = stats, loadFailed = failed,
                        session = session, index = 0, revealed = false, practice = practice,
                        phase = if (finished) StudyPhase.FINISHED else StudyPhase.DAY,
                    )
                }
            } catch (e: ApiException) {
                // Couldn't read: never treat that as "nothing saved" (saving stays off).
                ankiLoadFailed = true
                updateAnki { it.copy(loading = false, loadFailed = true) }
            }
        }
    }

    /** Saves one Anki value unless the load failed (in which case what is saved must not be overwritten). */
    private fun persistAnki(key: String, jsonText: String) {
        if (ankiLoadFailed) return
        viewModelScope.launch {
            try {
                authed { api.saveAppState(it, key, jsonText) }
                updateAnki { it.copy(saveFailed = false) }
            } catch (e: ApiException) {
                updateAnki { it.copy(saveFailed = true) }
            }
        }
    }

    fun ankiShowAnswer() = updateAnki { if (it.session == null || it.revealed) it else it.copy(revealed = true) }

    fun ankiNext() {
        val a = _state.value.anki ?: return
        val session = a.session ?: return
        if (a.index + 1 >= session.items.size) finishAnkiSession() else updateAnki { it.copy(index = a.index + 1, revealed = false) }
    }

    fun ankiPrevious() = updateAnki { if (it.index == 0) it else it.copy(index = it.index - 1, revealed = false) }

    fun ankiToggleHard(cardId: String) {
        val a = _state.value.anki ?: return
        val adding = cardId !in a.hard
        val hard = if (adding) a.hard + cardId else a.hard - cardId
        val stats = if (adding) AnkiLogic.markHard(a.stats, cardId) else a.stats
        updateAnki { it.copy(hard = hard, stats = stats) }
        if (adding) persistAnki("card-stats", AnkiLogic.encodeStats(stats))
        persistAnki("hard-words", AnkiLogic.encodeHard(hard))
    }

    private fun finishAnkiSession() {
        val a = _state.value.anki ?: return
        val session = a.session ?: return
        if (a.practice) {
            // Bonus practice: no progress, streak or card-stat changes.
            updateAnki {
                it.copy(
                    practice = false, phase = StudyPhase.COMPLETE,
                    completion = CompletionInfo(session.dayNumber, TOTAL_DAYS - a.progress.completed_days.size, a.progress.streak_count),
                )
            }
            return
        }
        val done = ProgressLogic.completeDay(a.progress, session.dayNumber)
        val next = done.progress
        val stats = AnkiLogic.markSeen(a.stats, session)
        updateAnki {
            it.copy(
                progress = next, stats = stats,
                completion = CompletionInfo(session.dayNumber, TOTAL_DAYS - next.completed_days.size, done.streak),
                phase = if (next.current_day > TOTAL_DAYS) StudyPhase.FINISHED else StudyPhase.COMPLETE,
            )
        }
        persistAnki("card-stats", AnkiLogic.encodeStats(stats))
        persistAnki("progress", ProgressLogic.encode(next))
    }

    fun ankiPracticeAgain(day: Int) {
        val a = _state.value.anki ?: return
        stopSpeech()
        updateAnki { it.copy(session = buildAnkiSession(day, a.progress, a.hard), index = 0, revealed = false, practice = true, phase = StudyPhase.DAY) }
    }

    fun ankiContinueToNextDay() {
        val a = _state.value.anki ?: return
        stopSpeech()
        if (a.progress.current_day > TOTAL_DAYS) {
            updateAnki { it.copy(phase = StudyPhase.FINISHED) }
            return
        }
        updateAnki {
            it.copy(session = buildAnkiSession(a.progress.current_day, a.progress, a.hard), index = 0, revealed = false, phase = StudyPhase.DAY)
        }
    }

    fun ankiAskReset(confirming: Boolean) = updateAnki { it.copy(confirmingReset = confirming) }

    fun ankiDoReset() {
        val fresh = SectionProgress()
        stopSpeech()
        updateAnki {
            it.copy(
                progress = fresh, hard = emptySet(), stats = emptyMap(), confirmingReset = false,
                session = buildAnkiSession(1, fresh, emptySet()), index = 0, revealed = false, practice = false,
                phase = StudyPhase.DAY, completion = null,
            )
        }
        persistAnki("progress", ProgressLogic.encode(fresh))
        persistAnki("hard-words", AnkiLogic.encodeHard(emptyList()))
        persistAnki("card-stats", AnkiLogic.encodeStats(emptyMap()))
    }

    // ---- Audio (French pronunciation) -------------------------------------------------------------

    /** Says a French word or phrase. Quietly does nothing if the audio isn't available. */
    fun speak(text: String) {
        speakJob?.cancel()
        speakJob = viewModelScope.launch {
            val audio = try { authed { api.textToSpeech(it, text) } } catch (e: ApiException) { null }
            if (audio != null) speech.play(audio)
        }
    }

    private fun stopSpeech() {
        speakJob?.cancel()
        speech.stop()
    }

    override fun onCleared() {
        stopSpeech()
        super.onCleared()
    }

    // ---- Grammar chapter PDFs (premium and super) ----------------------------------------------------

    /** Asks for the pages of one book's chapters and opens them for reading. The server enforces the tier too. */
    fun openGrammarPdf(group: BookChapters) {
        val study = _state.value.study ?: return
        if (study.pdfLoading) return
        editStudy { it.copy(pdfLoading = true, pdfError = null) }
        viewModelScope.launch {
            val result = try {
                authed { api.grammarPages(it, group.book, group.chapters) }
            } catch (e: ApiException) {
                GrammarPagesResult.Failed
            }
            when (result) {
                is GrammarPagesResult.Pdf -> {
                    val file = File(cacheDir, "grammar-pages.pdf")
                    withContext(Dispatchers.IO) { file.writeBytes(result.bytes) }
                    editStudy { it.copy(pdfLoading = false, pdfViewer = PdfViewer(group.label, file.path)) }
                }
                GrammarPagesResult.TierRequired ->
                    editStudy { it.copy(pdfLoading = false, pdfError = "Grammar chapter PDFs are a Premium feature.") }
                GrammarPagesResult.Failed ->
                    editStudy { it.copy(pdfLoading = false, pdfError = "Couldn't load those pages. Try again.") }
            }
        }
    }

    fun closeGrammarPdf() = editStudy { it.copy(pdfViewer = null) }

    // ---- Day-plan PDF download (premium: 1 per 24 hours, super: unlimited) ---------------------------

    private fun updateDayPlan(change: (DayPlanState) -> DayPlanState) = _state.update { it.copy(dayPlan = change(it.dayPlan)) }

    /** Reads whether a download is allowed now (premium and super only; free accounts never see the button). */
    fun loadPdfQuota() {
        if (!_state.value.tier.atLeast(Tier.PREMIUM)) return
        viewModelScope.launch {
            val quota = try { authed { api.pdfQuota(it) } } catch (e: ApiException) { null }
            updateDayPlan { it.copy(quota = quota) }
        }
    }

    private fun refundPdf(id: Long) {
        viewModelScope.launch {
            try { authed { api.refundPdfDownload(it, id) } } catch (e: ApiException) { /* best effort: it also expires on its own */ }
            loadPdfQuota()
        }
    }

    /**
     * Reserves a download (the limit is enforced by the database, not the app), builds the PDF on the phone, and
     * hands it to the screen to be saved. If building it fails, the download is given back.
     */
    fun requestDayPlanPdf(day: Int) {
        val current = _state.value.dayPlan
        if (current.busy || current.ready != null) return
        updateDayPlan { it.copy(busy = true, error = null) }
        viewModelScope.launch {
            val claim = try { authed { api.claimPdfDownload(it, day) } } catch (e: ApiException) { null }
            if (claim == null) {
                updateDayPlan { it.copy(busy = false, error = "Couldn't check your download allowance. Please try again.") }
                return@launch
            }
            if (!claim.ok || claim.id == null) {
                // used up (or not allowed): show when the next one is available
                updateDayPlan { it.copy(busy = false, quota = claim.status ?: it.quota) }
                return@launch
            }
            try {
                fun dayOf(section: PlanSection) = plan.days(section).first { it.day == day }
                val content = DayPlanLogic.build(
                    dayOf(PlanSection.ANKI), dayOf(PlanSection.GRAMMAR), dayOf(PlanSection.KWIZIQ), dayOf(PlanSection.TV5), dayOf(PlanSection.WRITING),
                )
                val date = LocalDate.now().format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US))
                val bytes = withContext(Dispatchers.Default) { DayPlanPdf.render(content, date) }
                updateDayPlan { it.copy(busy = false, ready = PdfReady(DayPlanLogic.fileName(day), bytes, claim.id), quota = claim.status ?: it.quota) }
            } catch (e: Exception) {
                refundPdf(claim.id)
                updateDayPlan { it.copy(busy = false, error = "Couldn't create the PDF. Your download was not used - please try again.") }
            }
        }
    }

    /** Saves the finished PDF to the place the user chose. */
    fun writeDayPlanPdf(uri: Uri) {
        val ready = _state.value.dayPlan.ready ?: return
        viewModelScope.launch {
            val saved = withContext(Dispatchers.IO) {
                try { resolver.openOutputStream(uri)?.use { it.write(ready.bytes); true } ?: false } catch (e: Exception) { false }
            }
            if (saved) {
                updateDayPlan { it.copy(ready = null) }
            } else {
                refundPdf(ready.claimId)
                updateDayPlan { it.copy(ready = null, error = "Couldn't save the PDF. Your download was not used - please try again.") }
            }
        }
    }

    /** The user backed out of choosing where to save: nothing was delivered, so the download is given back. */
    fun cancelDayPlanPdf() {
        val ready = _state.value.dayPlan.ready ?: return
        updateDayPlan { it.copy(ready = null) }
        refundPdf(ready.claimId)
    }
}
