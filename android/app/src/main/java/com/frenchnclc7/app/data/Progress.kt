package com.frenchnclc7.app.data

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

object Progress {
    /** The `completed_days` list inside one section's saved progress (a JSON string); empty if unreadable. */
    fun completedDays(progressJson: String?): Set<Int> {
        if (progressJson.isNullOrBlank()) return emptySet()
        return try {
            val obj: JsonObject = Json.parseToJsonElement(progressJson).jsonObject
            obj["completed_days"]?.jsonArray?.map { it.jsonPrimitive.int }?.toSet() ?: emptySet()
        } catch (e: Exception) {
            emptySet()
        }
    }

    /** Highest day N such that every section has completed days 1..N (same rule as the web app's home screen). */
    fun fullyCompletedThrough(sets: List<Set<Int>>, total: Int = TOTAL_DAYS): Int {
        var n = 0
        while (n < total && sets.isNotEmpty() && sets.all { (n + 1) in it }) n++
        return n
    }
}
