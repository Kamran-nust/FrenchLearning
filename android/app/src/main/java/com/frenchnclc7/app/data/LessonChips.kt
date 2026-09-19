package com.frenchnclc7.app.data

import java.net.URLEncoder

/**
 * How Kwiziq and TV5MONDE days are broken into lesson "chips" (the same rules as the web app),
 * and the Google-search link each chip opens.
 */
object LessonChips {
    // Many TV5 days start with the level name ("Première classe: ..."); the level is shown as a badge instead.
    private val levelPrefix = Regex("^(Première classe|A1-A2|A2-B1|B1-B2|A1|A2|B1|B2)\\s*:\\s*")

    private fun split(text: String) = text.split(";").map { it.trim() }.filter { it.isNotEmpty() }

    /** The lesson chips for a day; empty for sections that don't use chips. */
    fun chips(section: PlanSection, day: DayContent): List<String> = when (section) {
        PlanSection.KWIZIQ -> split(day.text)
        PlanSection.TV5 -> split(day.text.replace(levelPrefix, ""))
        else -> emptyList()
    }

    /** The main text shown on the day card. */
    fun body(section: PlanSection, day: DayContent): String {
        if (section != PlanSection.TV5) return day.text
        val chips = chips(section, day)
        return if (chips.isNotEmpty()) chips.joinToString(" · ") else day.text
    }

    fun searchUrl(section: PlanSection, chip: String): String {
        val site = if (section == PlanSection.TV5) "site:tv5monde.com " else "site:french.kwiziq.com "
        // The web app uses encodeURIComponent, which writes spaces as %20 (not "+").
        return "https://www.google.com/search?q=" + URLEncoder.encode(site + chip, "UTF-8").replace("+", "%20")
    }
}
