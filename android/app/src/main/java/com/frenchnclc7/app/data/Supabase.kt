package com.frenchnclc7.app.data

import com.frenchnclc7.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
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

    companion object {
        /** Anything unknown counts as free (fail closed). */
        fun from(value: String?): Tier = entries.firstOrNull { it.name.equals(value, ignoreCase = true) } ?: FREE
    }
}

data class Session(val accessToken: String, val refreshToken: String, val userId: String, val email: String)

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

    private suspend fun call(method: String, path: String, token: String?, body: JsonObject? = null): Reply =
        withContext(Dispatchers.IO) {
            val builder = Request.Builder()
                .url(baseUrl + path)
                .header("apikey", key)
                .header("Authorization", "Bearer " + (token ?: key))
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
}
