package com.frenchnclc7.app.data

import com.frenchnclc7.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

/** Account tiers, lowest to highest. The tier itself lives in the database. */
enum class Tier(val label: String) {
    FREE("Free"), PREMIUM("Premium"), SUPER("Super");

    /** True if this tier is [minimum] or higher (free < premium < super). */
    fun atLeast(minimum: Tier): Boolean = ordinal >= minimum.ordinal

    companion object {
        /** Anything unknown counts as free (fail closed). */
        fun from(value: String?): Tier = entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: FREE
    }
}

data class Session(val accessToken: String, val refreshToken: String, val userId: String, val email: String)

/** What reading one saved value found. Only [Empty] is safe to treat as "start fresh". */
sealed interface AppRead {
    data class Found(val text: String) : AppRead
    data object Empty : AppRead
    data object Failed : AppRead
}

/** How a request for grammar chapter pages ended. */
sealed interface GrammarPagesResult {
    class Pdf(val bytes: ByteArray) : GrammarPagesResult
    /** The account is not premium (or super). */
    data object TierRequired : GrammarPagesResult
    data object Failed : GrammarPagesResult
}

class ApiException(message: String, val status: Int = 0) : Exception(message)

/**
 * A small client for the same Supabase backend the web app uses (email/password
 * sign-in, the username sign-in function, and the database's row-level-security
 * protected tables). No secrets live here: the key is the public publishable one.
 */
class SupabaseApi(private val client: OkHttpClient = OkHttpClient()) {
    private val baseUrl = BuildConfig.SUPABASE_URL
    private val key = BuildConfig.SUPABASE_KEY
    private val jsonType = "application/json".toMediaType()

    private data class Reply(val status: Int, val body: String)

    private suspend fun call(
        method: String,
        path: String,
        token: String?,
        body: JsonObject? = null,
        headers: Map<String, String> = emptyMap(),
    ): Reply =
        withContext(Dispatchers.IO) {
            val builder = Request.Builder()
                .url(baseUrl + path)
                .header("apikey", key)
                .header("Authorization", "Bearer " + (token ?: key))
            headers.forEach { (k, v) -> builder.header(k, v) }
            when (method) {
                "GET" -> builder.get()
                else -> builder.method(method, (body?.toString() ?: "{}").toRequestBody(jsonType))
            }
            try {
                client.newCall(builder.build()).execute().use { Reply(it.code, it.body?.string() ?: "") }
            } catch (e: java.io.IOException) {
                throw ApiException("Couldn't reach the server. Check your connection.")
            }
        }

    private fun parse(text: String): JsonElement =
        try { Json.parseToJsonElement(text) } catch (e: Exception) { JsonObject(emptyMap()) }

    private fun message(reply: Reply, fallback: String): String {
        val el = parse(reply.body)
        if (el is JsonObject) {
            for (k in listOf("error_description", "msg", "message", "error")) {
                el[k]?.jsonPrimitive?.contentOrNull?.let { return it }
            }
        }
        return fallback
    }

    private fun sessionFrom(obj: JsonObject): Session {
        val user = obj["user"]?.jsonObject
        return Session(
            accessToken = obj["access_token"]?.jsonPrimitive?.contentOrNull ?: throw ApiException("Sign-in failed."),
            refreshToken = obj["refresh_token"]?.jsonPrimitive?.contentOrNull ?: "",
            userId = user?.get("id")?.jsonPrimitive?.contentOrNull ?: "",
            email = user?.get("email")?.jsonPrimitive?.contentOrNull ?: "",
        )
    }

    suspend fun signInWithEmail(email: String, password: String): Session {
        val reply = call("POST", "/auth/v1/token?grant_type=password", null, buildJsonObject {
            put("email", email); put("password", password)
        })
        if (reply.status !in 200..299) throw ApiException(message(reply, "Sign-in failed."), reply.status)
        return sessionFrom(parse(reply.body).jsonObject)
    }

    /** Username sign-in goes through the same `sign-in` Edge Function as the web app. */
    suspend fun signInWithUsername(username: String, password: String): Session {
        val reply = call("POST", "/functions/v1/sign-in", null, buildJsonObject {
            put("username", username); put("password", password)
        })
        if (reply.status !in 200..299) throw ApiException(message(reply, "Sign-in failed."), reply.status)
        val obj = parse(reply.body).jsonObject
        val access = obj["access_token"]?.jsonPrimitive?.contentOrNull ?: throw ApiException("Sign-in failed.")
        val refresh = obj["refresh_token"]?.jsonPrimitive?.contentOrNull ?: ""
        return sessionFor(access, refresh)
    }

    private suspend fun sessionFor(access: String, refresh: String): Session {
        val reply = call("GET", "/auth/v1/user", access)
        if (reply.status !in 200..299) throw ApiException(message(reply, "Sign-in failed."), reply.status)
        val user = parse(reply.body).jsonObject
        return Session(
            access, refresh,
            user["id"]?.jsonPrimitive?.contentOrNull ?: "",
            user["email"]?.jsonPrimitive?.contentOrNull ?: "",
        )
    }

    suspend fun refresh(refreshToken: String): Session {
        val reply = call("POST", "/auth/v1/token?grant_type=refresh_token", null, buildJsonObject {
            put("refresh_token", refreshToken)
        })
        if (reply.status !in 200..299) throw ApiException(message(reply, "Session expired."), reply.status)
        return sessionFrom(parse(reply.body).jsonObject)
    }

    /** Creates an account. The user must confirm their email before signing in. */
    suspend fun signUp(email: String, password: String, username: String) {
        val reply = call("POST", "/auth/v1/signup", null, buildJsonObject {
            put("email", email); put("password", password)
            put("data", buildJsonObject { put("username", username) })
        })
        if (reply.status !in 200..299) throw ApiException(message(reply, "Couldn't create the account."), reply.status)
    }

    suspend fun usernameAvailable(name: String): Boolean {
        val reply = call("POST", "/rest/v1/rpc/username_available", null, buildJsonObject { put("name", name) })
        return reply.status in 200..299 && reply.body.trim() == "true"
    }

    suspend fun tier(session: Session): Tier {
        val reply = call("GET", "/rest/v1/user_tiers?select=tier&user_id=eq." + session.userId, session.accessToken)
        if (reply.status !in 200..299) return Tier.FREE
        val rows = parse(reply.body) as? JsonArray ?: return Tier.FREE
        return Tier.from(rows.firstOrNull()?.jsonObject?.get("tier")?.jsonPrimitive?.contentOrNull)
    }

    suspend fun username(session: Session): String? {
        val reply = call("GET", "/rest/v1/profiles?select=username&user_id=eq." + session.userId, session.accessToken)
        if (reply.status !in 200..299) return null
        val rows = parse(reply.body) as? JsonArray ?: return null
        return rows.firstOrNull()?.jsonObject?.get("username")?.jsonPrimitive?.contentOrNull
    }

    /**
     * Saved progress per storage key (a map of key to the saved JSON text).
     * Returns null if the read failed, so callers never treat "couldn't read" as "nothing saved".
     */
    suspend fun appState(session: Session, keys: List<String>): Map<String, String>? {
        val list = keys.joinToString(",")
        val reply = call("GET", "/rest/v1/app_state?select=key,value&user_id=eq.${session.userId}&key=in.($list)", session.accessToken)
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) return null
        val rows = parse(reply.body) as? JsonArray ?: return null
        val out = mutableMapOf<String, String>()
        for (row in rows) {
            val obj = row.jsonObject
            val k = obj["key"]?.jsonPrimitive?.contentOrNull ?: continue
            val v = obj["value"]
            // The web app stores the progress JSON as a string inside the jsonb column.
            if (v is JsonPrimitive && v.isString) out[k] = v.content else if (v != null) out[k] = v.toString()
        }
        return out
    }

    /** Reads one saved value, telling "nothing saved yet" apart from "couldn't read it". */
    suspend fun readAppValue(session: Session, key: String): AppRead {
        val reply = call("GET", "/rest/v1/app_state?select=value&user_id=eq.${session.userId}&key=eq.$key", session.accessToken)
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) return AppRead.Failed
        val rows = parse(reply.body) as? JsonArray ?: return AppRead.Failed
        val value = rows.firstOrNull()?.jsonObject?.get("value") ?: return AppRead.Empty
        if (value is kotlinx.serialization.json.JsonNull) return AppRead.Empty
        return AppRead.Found(if (value is JsonPrimitive && value.isString) value.content else value.toString())
    }

    /** Saves one value (the JSON text) for this user, replacing what was there. Throws if it couldn't be saved. */
    suspend fun saveAppState(session: Session, key: String, jsonText: String) {
        val reply = call(
            "POST", "/rest/v1/app_state?on_conflict=user_id,key", session.accessToken,
            buildJsonObject {
                put("user_id", session.userId)
                put("key", key)
                put("value", jsonText) // the web app stores the progress JSON as a string in the jsonb column
            },
            mapOf("Prefer" to "resolution=merge-duplicates,return=minimal"),
        )
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) throw ApiException(message(reply, "Couldn't save."), reply.status)
    }

    // ---- Word Bank ------------------------------------------------------------------------------

    /** The person's words. The database first copies in any starter words they don't have yet; free accounts get none. */
    suspend fun wordBankList(session: Session): List<WordBankWord> {
        val reply = call("POST", "/rest/v1/rpc/word_bank_list", session.accessToken, buildJsonObject { })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) throw ApiException(message(reply, "Couldn't load your words."), reply.status)
        return WordBankLogic.parseList(reply.body) ?: throw ApiException("Couldn't read your words.")
    }

    private fun wordBankReply(reply: Reply, fallback: String): WordBankWord {
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) {
            if (reply.body.contains("word_bank_limit")) throw ApiException("word_bank_limit", reply.status)
            throw ApiException(message(reply, fallback), reply.status)
        }
        return WordBankLogic.parseList(reply.body)?.firstOrNull() ?: throw ApiException(fallback)
    }

    suspend fun wordBankAdd(session: Session, french: String, english: String, note: String?, addedDay: Int): WordBankWord =
        wordBankReply(
            call(
                "POST", "/rest/v1/word_bank_words", session.accessToken,
                buildJsonObject {
                    put("french", french); put("english", english)
                    put("note", if (note == null) JsonNull else JsonPrimitive(note))
                    put("added_day", addedDay)
                },
                mapOf("Prefer" to "return=representation"),
            ),
            "Couldn't save that word.",
        )

    suspend fun wordBankUpdate(session: Session, id: String, french: String, english: String, note: String?): WordBankWord =
        wordBankReply(
            call(
                "PATCH", "/rest/v1/word_bank_words?id=eq.$id", session.accessToken,
                buildJsonObject {
                    put("french", french); put("english", english)
                    put("note", if (note == null) JsonNull else JsonPrimitive(note))
                },
                mapOf("Prefer" to "return=representation"),
            ),
            "Couldn't save the change.",
        )

    /** Their own words are deleted; a starter word is only hidden, so it stays gone and can be brought back. */
    suspend fun wordBankRemove(session: Session, word: WordBankWord) {
        val reply = if (word.starter_id != null) {
            call("PATCH", "/rest/v1/word_bank_words?id=eq.${word.id}", session.accessToken, buildJsonObject { put("hidden", true) })
        } else {
            call("DELETE", "/rest/v1/word_bank_words?id=eq.${word.id}", session.accessToken)
        }
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) throw ApiException(message(reply, "Couldn't remove that word."), reply.status)
    }

    /** Brings back hidden starter words and undoes edits to them. */
    suspend fun wordBankResetStarter(session: Session) {
        val reply = call("POST", "/rest/v1/rpc/word_bank_reset_starter", session.accessToken, buildJsonObject { })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) throw ApiException(message(reply, "Couldn't restore the starter words."), reply.status)
    }

    /** Where the person stands with today's AI feedback allowance; null if it can't be read. */
    suspend fun feedbackQuota(session: Session): FeedbackQuota? {
        val reply = call("POST", "/rest/v1/rpc/feedback_quota", session.accessToken, buildJsonObject { })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) return null
        return FeedbackParser.quota(parse(reply.body))
    }

    /** Asks the AI for feedback on a draft (the same writing-feedback function the web app uses). */
    suspend fun writingFeedback(session: Session, task: String, draft: String): FeedbackOutcome {
        val reply = try {
            call("POST", "/functions/v1/writing-feedback", session.accessToken, buildJsonObject {
                put("task", task); put("draft", draft)
            })
        } catch (e: ApiException) {
            return FeedbackOutcome.Failed
        }
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        return FeedbackParser.outcome(reply.status, reply.body)
    }

    /** French pronunciation for a word or phrase (an MP3), from the same text-to-speech function the web app uses. Null if unavailable. */
    suspend fun textToSpeech(session: Session, text: String): ByteArray? {
        val reply = call("POST", "/functions/v1/text-to-speech", session.accessToken, buildJsonObject { put("text", text) })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) return null
        val audio = (parse(reply.body) as? JsonObject)?.get("audioContent")?.jsonPrimitive?.contentOrNull ?: return null
        return try { java.util.Base64.getDecoder().decode(audio) } catch (e: IllegalArgumentException) { null }
    }

    /** A small PDF of just the given chapters of a grammar book (premium and super only, enforced by the function). */
    suspend fun grammarPages(session: Session, book: String, chapters: List<Int>): GrammarPagesResult =
        withContext(Dispatchers.IO) {
            val body = buildJsonObject {
                put("book", book)
                put("chapters", JsonArray(chapters.map { JsonPrimitive(it) }))
            }
            val request = Request.Builder()
                .url(baseUrl + "/functions/v1/grammar-pages")
                .header("apikey", key)
                .header("Authorization", "Bearer " + session.accessToken)
                .post(body.toString().toRequestBody(jsonType))
                .build()
            try {
                client.newCall(request).execute().use { response ->
                    when {
                        response.code == 401 -> throw ApiException("Session expired.", 401)
                        response.code == 403 -> GrammarPagesResult.TierRequired
                        !response.isSuccessful -> GrammarPagesResult.Failed
                        else -> {
                            val bytes = response.body?.bytes() ?: ByteArray(0)
                            // a real PDF starts with "%PDF"
                            if (bytes.size > 4 && bytes[0] == '%'.code.toByte() && bytes[1] == 'P'.code.toByte()) GrammarPagesResult.Pdf(bytes)
                            else GrammarPagesResult.Failed
                        }
                    }
                }
            } catch (e: java.io.IOException) {
                GrammarPagesResult.Failed
            }
        }

    /**
     * The direct lesson links for a module ("kwiziq" or "tv5"): approved chip links and extra links.
     * Only premium and super accounts are given rows by the database; anyone else gets nothing back.
     * A part that can't be read counts as empty, so the chips simply stay Google searches.
     */
    suspend fun lessonLinks(session: Session, module: String): LessonLinks {
        val chips = call("GET", "/rest/v1/lesson_links?select=chip,url&module=eq.$module&approved=eq.true", session.accessToken)
        if (chips.status == 401) throw ApiException("Session expired.", 401)
        val extras = call("GET", "/rest/v1/lesson_extra_links?select=day,label,url,sort&module=eq.$module&approved=eq.true&order=sort", session.accessToken)
        if (extras.status == 401) throw ApiException("Session expired.", 401)
        return LessonLinkLogic.parse(
            if (chips.status in 200..299) chips.body else null,
            if (extras.status in 200..299) extras.body else null,
        )
    }

    /** Whether another day-plan PDF may be downloaded now (premium: 1 per 24 hours, super: unlimited). Null if it can't be read. */
    suspend fun pdfQuota(session: Session): PdfQuota? {
        val reply = call("POST", "/rest/v1/rpc/pdf_quota", session.accessToken, buildJsonObject { })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) return null
        return DayPlanLogic.parseQuota(reply.body)
    }

    /** Reserves one download for the caller. The database refuses when the allowance is used up. Null if the request failed. */
    suspend fun claimPdfDownload(session: Session, day: Int): PdfClaim? {
        val reply = call("POST", "/rest/v1/rpc/claim_pdf_download", session.accessToken, buildJsonObject { put("p_day", day) })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) return null
        return DayPlanLogic.parseClaim(reply.body)
    }

    /** Gives a reserved download back (only your own, and only within two minutes; the database enforces that). */
    suspend fun refundPdfDownload(session: Session, id: Long) {
        val reply = call("POST", "/rest/v1/rpc/refund_pdf_download", session.accessToken, buildJsonObject { put("p_id", id) })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
    }

    /** Every user with tier and recent activity (super users only; the database refuses anyone else). */
    suspend fun adminListUsers(session: Session): List<AdminUser> {
        val reply = call("POST", "/rest/v1/rpc/admin_list_users", session.accessToken, buildJsonObject { })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) throw ApiException(message(reply, "Couldn't load users."), reply.status)
        return AdminLogic.parseUsers(reply.body) ?: throw ApiException("Couldn't read the user list.")
    }

    /** Changes one person's tier (super users only; the database also refuses to remove the last super user). */
    suspend fun setUserTier(session: Session, userId: String, tier: Tier) {
        val reply = call("POST", "/rest/v1/rpc/set_user_tier", session.accessToken, buildJsonObject {
            put("target", userId)
            put("new_tier", tier.name.lowercase())
        })
        if (reply.status == 401) throw ApiException("Session expired.", 401)
        if (reply.status !in 200..299) throw ApiException(message(reply, "Couldn't change the tier."), reply.status)
    }
}
