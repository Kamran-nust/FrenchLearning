package com.frenchnclc7.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.frenchnclc7.app.data.AdminLogic
import com.frenchnclc7.app.data.AdminUser
import com.frenchnclc7.app.data.AnkiLimits
import com.frenchnclc7.app.data.AnkiLogic
import com.frenchnclc7.app.data.WordBankCard
import com.frenchnclc7.app.data.WordBankLogic
import com.frenchnclc7.app.data.WordBankWord
import com.frenchnclc7.app.data.AnkiSession
import com.frenchnclc7.app.data.ApiException
import com.frenchnclc7.app.data.CardStat
import com.frenchnclc7.app.data.SpeechPlayer
import com.frenchnclc7.app.data.AppRead
import com.frenchnclc7.app.data.BillingPeriod
import com.frenchnclc7.app.data.BookChapters
import com.frenchnclc7.app.data.NotConfiguredBilling
import com.frenchnclc7.app.data.PlansLogic
import com.frenchnclc7.app.data.PlayBilling
import com.frenchnclc7.app.data.PurchaseResult
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
    /** Manage users' tiers (super users only). */
    data object Admin : Screen
    /** Free versus Premium, with monthly/yearly. */
    data object Plans : Screen
    /** The personal word list (Premium and Super). */
    data object WordBank : Screen
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
    /** The person's Word Bank words as cards; they join the review words each time a session is built. */
    val customCards: List<WordBankCard> = emptyList(),
    /** Cards seen today (saved as anki-daily). */
    val dailySeen: Int = 0,
    /** Cards of the current session already added to today's total. */
    val counted: Int = 0,
    /** Today's limit is used up, so no new session can start until tomorrow. */
    val limitHit: Boolean = false,
)

/** The Word Bank screen: the list, the add form, editing and the small confirmations. */
data class WordBankState(
    /** null while loading. */
    val words: List<WordBankWord>? = null,
    val loadError: Boolean = false,
    val query: String = "",
    val showCount: Int = 100,
    val french: String = "",
    val english: String = "",
    val note: String = "",
    val addError: String? = null,
    val busy: Boolean = false,
    val editingId: String? = null,
    val editFrench: String = "",
    val editEnglish: String = "",
    val editNote: String = "",
    val editError: String? = null,
    val confirmId: String? = null,
    val confirmReset: Boolean = false,
    val notice: String? = null,
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

data class PlansState(
    val period: BillingPeriod = BillingPeriod.YEARLY,
    val busy: Boolean = false,
    val message: String? = null,
)

data class AdminState(
    /** null while loading. */
    val users: List<AdminUser>? = null,
    val loadError: String? = null,
    val query: String = "",
    /** People whose tier change is being saved right now. */
    val saving: Set<String> = emptySet(),
    val rowErrors: Map<String, String> = emptyMap(),
    /** Someone about to be made super, waiting for the yes/no. */
    val confirmSuper: AdminUser? = null,
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
    val admin: AdminState? = null,
    val plans: PlansState = PlansState(),
    val wordBank: WordBankState? = null,
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
                // If the saved sign-in can't be renewed (the server says no, e.g. the account or session is gone),
                // treat it as signed out. A network problem (no status) is passed on as it is.
                s = try {
                    api.refresh(s.refreshToken)
                } catch (r: ApiException) {
                    if (r.status in 400..499) throw ApiException("Please sign in again.", 401) else throw r
                }
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
    /**
     * The day page a section was opened from (Home's "Jump to a day"): Back from that section returns here,
     * with that section selected. Null when the section was opened straight from Home.
     */
    private var returnTo: Screen.Day? = null

    /**
     * The read-only day viewer (Home's "Jump to a day"). Moving to another day keeps the section that is
     * showing; pass [section] to switch to a different one.
     */
    fun browseDay(day: Int, section: PlanSection? = null) {
        flushWriting()
        stopSpeech()
        val shown = section ?: (_state.value.screen as? Screen.Day)?.section ?: PlanSection.ANKI
        _state.update { it.copy(screen = Screen.Day(shown, day.coerceIn(1, TOTAL_DAYS)), study = null, writing = null, anki = null) }
    }

    fun open(section: PlanSection, day: Int? = null) {
        // Remember where we came from: from a day page, Back returns to that day; from Home, Back returns to Home.
        when (val here = _state.value.screen) {
            is Screen.Day -> returnTo = Screen.Day(section, here.day)
            Screen.Home -> returnTo = null
            else -> {} // moving between sections keeps what was remembered
        }
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

    /** The system Back button/gesture, decided from whichever screen is showing. */
    fun systemBack() {
        when (_state.value.screen) {
            Screen.Study -> if (_state.value.study?.pdfViewer != null) closeGrammarPdf() else back()
            Screen.Writing, Screen.Anki -> back()
            else -> home()
        }
    }

    /**
     * Back from a section (Grammar, Kwiziq, TV5MONDE, Writing, Anki): to the day page it was opened from if it
     * was opened from one, otherwise Home.
     */
    fun back() {
        val target = returnTo
        if (target == null) {
            home()
            return
        }
        returnTo = null
        val hadStudy = _state.value.study != null || _state.value.writing != null || _state.value.anki != null
        flushWriting()
        stopSpeech()
        _state.update { it.copy(screen = target, study = null, writing = null, anki = null, admin = null) }
        if (hadStudy) refreshOverview()
    }

    /** Home. Also re-reads the overall progress so "Day N complete" reflects what was just done. */
    fun home() {
        returnTo = null
        val hadStudy = _state.value.study != null || _state.value.writing != null || _state.value.anki != null
        flushWriting()
        stopSpeech()
        _state.update { it.copy(screen = Screen.Home, study = null, writing = null, anki = null, admin = null) }
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

    private fun today(): String = ProgressLogic.dateKey(LocalDate.now())

    /** Saves today's card count (shared with the web app as anki-daily). */
    private fun persistDaily(seen: Int) = persistAnki("anki-daily", AnkiLimits.encodeCount(today(), seen))

    /**
     * Starts a session for [day]: sized for the person's tier, with their Word Bank words mixed into the reviews,
     * and the first card counted towards today's limit. If today's limit is already used up, no session starts.
     */
    private fun newAnkiSession(a: AnkiState, day: Int, practice: Boolean): AnkiState {
        val tier = _state.value.tier
        if (AnkiLimits.limitReached(tier, a.dailySeen)) {
            return a.copy(session = null, index = 0, revealed = false, practice = practice, phase = StudyPhase.DAY, limitHit = true, counted = 0)
        }
        val session = AnkiLogic.buildSession(
            ankiDays(), day, a.progress.completed_days.size, a.hard,
            custom = a.customCards, tier = tier, practice = practice, seen = a.dailySeen,
        )
        val first = if (AnkiLimits.dailyLimit(tier) != null && session != null && session.items.isNotEmpty()) 1 else 0
        return a.copy(
            session = session, index = 0, revealed = false, practice = practice, phase = StudyPhase.DAY,
            limitHit = false, counted = first, dailySeen = a.dailySeen + first,
        )
    }

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
                    listOf(
                        api.readAppValue(s, "progress"), api.readAppValue(s, "hard-words"),
                        api.readAppValue(s, "card-stats"), api.readAppValue(s, "anki-daily"),
                    )
                }
                var failed = false
                val progress = when (val r = reads[0]) {
                    AppRead.Empty -> SectionProgress()
                    AppRead.Failed -> { failed = true; SectionProgress() }
                    is AppRead.Found -> ProgressLogic.decode(r.text) ?: run { failed = true; SectionProgress() }
                }
                val hard: Set<String> = when (val r = reads[1]) {
                    AppRead.Empty -> emptySet()
                    AppRead.Failed -> { failed = true; emptySet() }
                    is AppRead.Found -> AnkiLogic.decodeHard(r.text) ?: run { failed = true; emptySet() }
                }
                val stats: Map<String, CardStat> = when (val r = reads[2]) {
                    AppRead.Empty -> emptyMap()
                    AppRead.Failed -> { failed = true; emptyMap() }
                    is AppRead.Found -> AnkiLogic.decodeStats(r.text) ?: run { failed = true; emptyMap() }
                }
                val seen = when (val r = reads[3]) {
                    AppRead.Empty -> 0
                    AppRead.Failed -> { failed = true; 0 }
                    is AppRead.Found -> AnkiLimits.todaysCount(r.text, today())
                }
                ankiLoadFailed = failed
                // Word Bank words (none for free accounts); never blocks Anki if they can't be loaded.
                val custom = try { WordBankLogic.toCards(authed { api.wordBankList(it) }) } catch (e: ApiException) { emptyList() }
                val practice = practiceDay != null
                val finished = !practice && progress.current_day > TOTAL_DAYS
                val base = AnkiState(
                    loading = false, progress = progress, hard = hard, stats = stats, loadFailed = failed,
                    customCards = custom, dailySeen = seen,
                )
                val started = if (finished) base.copy(phase = StudyPhase.FINISHED)
                else newAnkiSession(base, if (practice) practiceDay!!.coerceIn(1, TOTAL_DAYS) else progress.current_day, practice)
                updateAnki { started }
                if (started.dailySeen != seen) persistDaily(started.dailySeen)
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
        val next = a.index + 1
        if (next >= session.items.size) {
            finishAnkiSession()
            return
        }
        // Only cards not seen before are added to today's total, so going back over a card doesn't count it twice.
        val counted = if (AnkiLimits.dailyLimit(_state.value.tier) != null) maxOf(a.counted, next + 1) else a.counted
        val added = counted - a.counted
        updateAnki { it.copy(index = next, revealed = false, counted = counted, dailySeen = it.dailySeen + added) }
        if (added > 0) persistDaily(a.dailySeen + added)
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
        val started = newAnkiSession(a, day, practice = true)
        updateAnki { started }
        if (started.dailySeen != a.dailySeen) persistDaily(started.dailySeen)
    }

    fun ankiContinueToNextDay() {
        val a = _state.value.anki ?: return
        stopSpeech()
        if (a.progress.current_day > TOTAL_DAYS) {
            updateAnki { it.copy(phase = StudyPhase.FINISHED) }
            return
        }
        val started = newAnkiSession(a, a.progress.current_day, practice = false)
        updateAnki { started }
        if (started.dailySeen != a.dailySeen) persistDaily(started.dailySeen)
    }

    fun ankiAskReset(confirming: Boolean) = updateAnki { it.copy(confirmingReset = confirming) }

    fun ankiDoReset() {
        val fresh = SectionProgress()
        val a = _state.value.anki ?: return
        stopSpeech()
        val reset = a.copy(progress = fresh, hard = emptySet(), stats = emptyMap(), confirmingReset = false, completion = null)
        val started = newAnkiSession(reset, 1, practice = false)
        updateAnki { started }
        if (started.dailySeen != a.dailySeen) persistDaily(started.dailySeen)
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

    // ---- Admin: manage users' tiers (super users only) --------------------------------------------------

    private fun updateAdmin(change: (AdminState) -> AdminState) {
        _state.update { ui -> ui.admin?.let { ui.copy(admin = change(it)) } ?: ui }
    }

    // ---- Word Bank (Premium and Super) ----

    private fun updateWordBank(change: (WordBankState) -> WordBankState) {
        _state.update { ui -> ui.wordBank?.let { ui.copy(wordBank = change(it)) } ?: ui }
    }

    /** Opens the Word Bank. Free accounts see the locked screen; the database refuses them anyway. */
    fun openWordBank() {
        returnTo = null
        _state.update { it.copy(screen = Screen.WordBank, wordBank = WordBankState()) }
        if (_state.value.tier.atLeast(Tier.PREMIUM)) loadWordBank()
    }

    fun loadWordBank() {
        updateWordBank { it.copy(loadError = false) }
        viewModelScope.launch {
            try {
                val words = authed { api.wordBankList(it) }
                updateWordBank { it.copy(words = words) }
            } catch (e: ApiException) {
                updateWordBank { it.copy(words = it.words ?: emptyList(), loadError = true) }
            }
        }
    }

    fun wbQuery(q: String) = updateWordBank { it.copy(query = q, showCount = 100) }
    fun wbShowMore() = updateWordBank { it.copy(showCount = it.showCount + 100) }
    fun wbFrench(v: String) = updateWordBank { it.copy(french = v.take(WordBankLogic.MAX_FRENCH)) }
    fun wbEnglish(v: String) = updateWordBank { it.copy(english = v.take(WordBankLogic.MAX_ENGLISH)) }
    fun wbNote(v: String) = updateWordBank { it.copy(note = v.take(WordBankLogic.MAX_NOTE)) }
    fun wbEditFrench(v: String) = updateWordBank { it.copy(editFrench = v.take(WordBankLogic.MAX_FRENCH)) }
    fun wbEditEnglish(v: String) = updateWordBank { it.copy(editEnglish = v.take(WordBankLogic.MAX_ENGLISH)) }
    fun wbEditNote(v: String) = updateWordBank { it.copy(editNote = v.take(WordBankLogic.MAX_NOTE)) }
    fun wbAskDelete(id: String?) = updateWordBank { it.copy(confirmId = id) }
    fun wbAskReset(confirming: Boolean) = updateWordBank { it.copy(confirmReset = confirming) }
    fun wbCancelEdit() = updateWordBank { it.copy(editingId = null, editError = null) }

    fun wbStartEdit(w: WordBankWord) = updateWordBank {
        it.copy(editingId = w.id, editFrench = w.french, editEnglish = w.english, editNote = w.note ?: "", editError = null, confirmId = null)
    }

    /** The day the person is on in Anki, stamped on each word they add (1 if it can't be read). */
    private suspend fun currentAnkiDay(): Int = try {
        when (val r = authed { api.readAppValue(it, "progress") }) {
            is AppRead.Found -> ProgressLogic.decode(r.text)?.current_day ?: 1
            else -> 1
        }.coerceIn(1, TOTAL_DAYS)
    } catch (e: ApiException) {
        1
    }

    fun wbAdd() {
        val w = _state.value.wordBank ?: return
        val tier = _state.value.tier
        val words = w.words ?: return
        val visible = words.filter { !it.hidden }
        val limit = WordBankLogic.ownLimit(tier)
        val limitMessage = "You've reached your limit of $limit words."
        val problem = WordBankLogic.validate(w.french, w.english, w.note)
            ?: if (!WordBankLogic.hasRoom(tier, visible)) limitMessage
            else if (WordBankLogic.isDuplicate(visible, w.french, w.english)) "That word is already in your list."
            else null
        if (problem != null) {
            updateWordBank { it.copy(addError = problem, notice = null) }
            return
        }
        updateWordBank { it.copy(busy = true, addError = null, notice = null) }
        viewModelScope.launch {
            try {
                val clean = WordBankLogic.clean(w.french, w.english, w.note)
                val day = currentAnkiDay()
                val saved = authed { api.wordBankAdd(it, clean.french, clean.english, clean.note, day) }
                updateWordBank {
                    it.copy(
                        words = (it.words ?: emptyList()) + saved, french = "", english = "", note = "", busy = false,
                        notice = "Added. It will appear in your Anki reviews from your next session.",
                    )
                }
            } catch (e: ApiException) {
                updateWordBank {
                    it.copy(busy = false, addError = if (e.message == "word_bank_limit") limitMessage else "Couldn't save that word. Try again.")
                }
            }
        }
    }

    fun wbSaveEdit(word: WordBankWord) {
        val w = _state.value.wordBank ?: return
        val visible = (w.words ?: return).filter { !it.hidden }
        val problem = WordBankLogic.validate(w.editFrench, w.editEnglish, w.editNote)
            ?: if (WordBankLogic.isDuplicate(visible, w.editFrench, w.editEnglish, word.id)) "That word is already in your list." else null
        if (problem != null) {
            updateWordBank { it.copy(editError = problem) }
            return
        }
        updateWordBank { it.copy(busy = true) }
        viewModelScope.launch {
            try {
                val clean = WordBankLogic.clean(w.editFrench, w.editEnglish, w.editNote)
                val saved = authed { api.wordBankUpdate(it, word.id, clean.french, clean.english, clean.note) }
                updateWordBank { ws -> ws.copy(words = ws.words?.map { x -> if (x.id == word.id) saved else x }, editingId = null, busy = false) }
            } catch (e: ApiException) {
                updateWordBank { it.copy(busy = false, editError = "Couldn't save the change. Try again.") }
            }
        }
    }

    fun wbRemove(word: WordBankWord) {
        updateWordBank { it.copy(busy = true, notice = null) }
        viewModelScope.launch {
            try {
                authed { api.wordBankRemove(it, word) }
                updateWordBank { ws ->
                    ws.copy(
                        words = if (WordBankLogic.isOwn(word)) ws.words?.filter { x -> x.id != word.id }
                        else ws.words?.map { x -> if (x.id == word.id) x.copy(hidden = true) else x },
                        confirmId = null, busy = false,
                    )
                }
            } catch (e: ApiException) {
                updateWordBank { it.copy(busy = false, notice = "Couldn't remove that word. Try again.") }
            }
        }
    }

    fun wbReset() {
        updateWordBank { it.copy(busy = true, notice = null) }
        viewModelScope.launch {
            try {
                authed { api.wordBankResetStarter(it) }
                val words = authed { api.wordBankList(it) }
                updateWordBank { it.copy(words = words, confirmReset = false, busy = false, notice = "Starter words restored.") }
            } catch (e: ApiException) {
                updateWordBank { it.copy(busy = false, notice = "Couldn't restore the starter words. Try again.") }
            }
        }
    }

    // ---- Plans (Premium subscription) ----

    /** Google Play Billing sits behind this; [NotConfiguredBilling] until the Play Console products exist. */
    private val billing: PlayBilling = NotConfiguredBilling

    fun openPlans() {
        returnTo = null
        _state.update { it.copy(screen = Screen.Plans, plans = PlansState(period = it.plans.period)) }
    }

    fun setPlanPeriod(period: BillingPeriod) = _state.update { it.copy(plans = it.plans.copy(period = period, message = null)) }

    fun upgrade() = runBilling { billing.purchase(_state.value.plans.period) }

    fun manageSubscription() = runBilling { billing.manage() }

    private fun runBilling(action: suspend () -> PurchaseResult) {
        _state.update { it.copy(plans = it.plans.copy(busy = true, message = null)) }
        viewModelScope.launch {
            val message = when (action()) {
                PurchaseResult.NotConfigured -> PlansLogic.NOT_SWITCHED_ON
                PurchaseResult.Failed -> PlansLogic.PURCHASE_FAILED
            }
            _state.update { it.copy(plans = it.plans.copy(busy = false, message = message)) }
        }
    }

    /** Opens the admin page. Only super users get here; the database refuses everyone else anyway. */
    fun openAdmin() {
        if (_state.value.tier != Tier.SUPER) return
        _state.update { it.copy(screen = Screen.Admin, admin = AdminState()) }
        loadAdminUsers()
    }

    fun loadAdminUsers() {
        updateAdmin { it.copy(loadError = null) }
        viewModelScope.launch {
            try {
                val users = authed { api.adminListUsers(it) }
                updateAdmin { it.copy(users = users) }
            } catch (e: ApiException) {
                updateAdmin { it.copy(users = it.users ?: emptyList(), loadError = "Couldn't load users. " + (e.message ?: "")) }
            }
        }
    }

    fun setAdminQuery(query: String) = updateAdmin { it.copy(query = query) }

    /** A tier was picked for someone. Making someone super asks first; every other change goes straight through. */
    fun requestTierChange(user: AdminUser, tier: Tier) {
        if (tier == user.tier) return
        if (AdminLogic.needsConfirmation(tier)) updateAdmin { it.copy(confirmSuper = user) } else applyTier(user, tier)
    }

    fun confirmPromotion() {
        val user = _state.value.admin?.confirmSuper ?: return
        updateAdmin { it.copy(confirmSuper = null) }
        applyTier(user, Tier.SUPER)
    }

    fun cancelPromotion() = updateAdmin { it.copy(confirmSuper = null) }

    /** Saves the change; the list only updates once the database has accepted it (otherwise the old tier stays and the reason shows). */
    private fun applyTier(user: AdminUser, tier: Tier) {
        updateAdmin { it.copy(saving = it.saving + user.userId, rowErrors = it.rowErrors - user.userId) }
        viewModelScope.launch {
            try {
                authed { api.setUserTier(it, user.userId, tier) }
                updateAdmin { a -> a.copy(users = a.users?.map { u -> if (u.userId == user.userId) u.copy(tier = tier) else u }) }
            } catch (e: ApiException) {
                updateAdmin { it.copy(rowErrors = it.rowErrors + (user.userId to (e.message ?: "Couldn't change the tier."))) }
            } finally {
                updateAdmin { it.copy(saving = it.saving - user.userId) }
            }
        }
    }
}
