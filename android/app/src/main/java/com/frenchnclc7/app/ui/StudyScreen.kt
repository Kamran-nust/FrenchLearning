package com.frenchnclc7.app.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.StudyPhase
import com.frenchnclc7.app.StudyState
import com.frenchnclc7.app.data.LessonChips
import com.frenchnclc7.app.data.PlanSection
import com.frenchnclc7.app.data.Tier
import com.frenchnclc7.app.data.TOTAL_DAYS

/**
 * The day-by-day study screen for Grammar, Kwiziq, TV5MONDE and Writing: read the day's task, mark it
 * complete, keep a streak. Progress is saved to the same place as the web app.
 */
@Composable
fun StudyScreen(study: StudyState, tier: Tier, vm: AppViewModel) {
    val c = LocalColors.current
    // Back closes an open PDF first, then leaves the section.
    BackHandler { if (study.pdfViewer != null) vm.closeGrammarPdf() else vm.home() }

    study.pdfViewer?.let { viewer ->
        PdfViewerScreen(viewer) { vm.closeGrammarPdf() }
        return
    }

    if (study.loading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Loading your session…", color = c.muted, fontSize = 14.sp)
        }
        return
    }

    val section = study.section
    val days = remember(section) { vm.plan.days(section) }
    val viewed = days.firstOrNull { it.day == study.viewDay }
    val progress = study.progress
    val done = progress.completed_days.size
    val finished = study.phase == StudyPhase.FINISHED

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        // Header: back, where you are, streak, progress bar
        Column(Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("‹", color = c.muted, fontSize = 24.sp, modifier = Modifier.clickable { vm.home() }.padding(end = 10.dp))
                Text(
                    if (finished) section.title + " plan complete" else "${section.title} · Day ${study.viewDay} of $TOTAL_DAYS",
                    color = c.muted, fontSize = 12.sp, modifier = Modifier.weight(1f),
                )
                Text(
                    "🔥 " + progress.streak_count,
                    color = if (progress.streak_count > 0) c.text else c.muted, fontSize = 12.sp, fontWeight = FontWeight.Medium,
                    modifier = Modifier.clip(RoundedCornerShape(50)).background(c.accentSoft).padding(horizontal = 10.dp, vertical = 4.dp),
                )
            }
            Spacer(Modifier.height(10.dp))
            Box(Modifier.fillMaxWidth().height(4.dp).clip(RoundedCornerShape(50)).background(c.border)) {
                Box(Modifier.fillMaxWidth(done.toFloat() / TOTAL_DAYS).height(4.dp).clip(RoundedCornerShape(50)).background(c.accent))
            }
            Spacer(Modifier.height(6.dp))
            Text("$done days done · ${TOTAL_DAYS - done} to go", color = c.muted, fontSize = 12.sp)
        }

        // Warnings about saving
        if (study.loadFailed) {
            Notice("Couldn't load your saved progress, so nothing will be saved this session (to protect what you already have). Check your connection and reopen this section.")
        } else if (study.saveFailed) {
            Notice("Progress isn't saving right now — it may be lost if you close the app.")
        }

        when (study.phase) {
            StudyPhase.FINISHED -> Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("✓", color = c.success, fontSize = 40.sp)
                Spacer(Modifier.height(12.dp))
                Text("All $TOTAL_DAYS days done", color = c.text, fontSize = 24.sp)
                Spacer(Modifier.height(6.dp))
                Text(
                    "Longest streak: ${progress.longest_streak} days. The ${section.title} module is finished.",
                    color = c.muted, fontSize = 14.sp, textAlign = TextAlign.Center,
                )
            }

            StudyPhase.COMPLETE -> Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                val info = study.completion
                Text("✓", color = c.success, fontSize = 40.sp)
                Spacer(Modifier.height(12.dp))
                Text("Day ${info?.day ?: ""} done", color = c.text, fontSize = 24.sp)
                Spacer(Modifier.height(4.dp))
                Text("${info?.remaining ?: 0} days left · streak ${info?.streak ?: 0}", color = c.muted, fontSize = 14.sp)
                Spacer(Modifier.height(24.dp))
                PrimaryButton("Start next day") { vm.continueNext() }
            }

            StudyPhase.DAY -> if (viewed == null) {
                Text("Nothing to show.", color = c.muted, fontSize = 14.sp, modifier = Modifier.padding(24.dp))
            } else {
                DayCard(study, section, viewed, tier, vm)
            }
        }

        ResetControl(study, vm)
    }
}

@Composable
private fun DayCard(study: StudyState, section: PlanSection, viewed: com.frenchnclc7.app.data.DayContent, tier: Tier, vm: AppViewModel) {
    val c = LocalColors.current
    val uri = LocalUriHandler.current
    val chips = LessonChips.chips(section, viewed)
    val pending = viewed.day == study.progress.current_day && study.progress.current_day <= TOTAL_DAYS

    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp)) {
        if (viewed.day != study.progress.current_day) {
            Text(
                "Reading only — your current day is Day ${minOf(study.progress.current_day, TOTAL_DAYS)}",
                color = c.muted, fontSize = 12.sp, modifier = Modifier.padding(bottom = 8.dp),
            )
        }

        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card)
                .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            viewed.badge?.let {
                Text(
                    it, color = c.link, fontSize = 11.sp, fontWeight = FontWeight.Medium,
                    modifier = Modifier.clip(RoundedCornerShape(50)).background(c.accentSoft).padding(horizontal = 10.dp, vertical = 4.dp),
                )
            }
            Text(LessonChips.body(section, viewed), color = c.text, fontSize = 15.sp, lineHeight = 22.sp, textAlign = TextAlign.Center)

            // Kwiziq / TV5MONDE lesson chips (a Google search for each; direct links are a later premium feature)
            chips.forEach { chip ->
                Row(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(c.accentSoft)
                        .clickable { uri.openUri(LessonChips.searchUrl(section, chip)) }.padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(chip, color = c.link, fontSize = 12.sp, modifier = Modifier.weight(1f), maxLines = 1)
                    Text("↗", color = c.link, fontSize = 12.sp)
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        Row(Modifier.fillMaxWidth()) {
            val prev = viewed.day > 1
            val next = viewed.day < TOTAL_DAYS
            Text(
                "‹ Previous", color = if (prev) c.link else c.muted, fontSize = 14.sp,
                modifier = Modifier.weight(1f).clickable(enabled = prev) { vm.studyMove(-1) }.padding(8.dp),
            )
            Text(
                "Next ›", color = if (next) c.link else c.muted, fontSize = 14.sp, textAlign = TextAlign.End,
                modifier = Modifier.weight(1f).clickable(enabled = next) { vm.studyMove(1) }.padding(8.dp),
            )
        }

        // Grammar: the book chapters for the day, as PDF pages (premium and super)
        if (section == PlanSection.GRAMMAR && viewed.chapters.isNotEmpty()) {
            Spacer(Modifier.height(4.dp))
            if (tier.atLeast(Tier.PREMIUM)) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    viewed.chapters.forEach { group ->
                        Text(
                            if (study.pdfLoading) "Loading pages…" else "📖 Open " + group.label,
                            color = c.link, fontSize = 12.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.accentSoft)
                                .clickable(enabled = !study.pdfLoading) { vm.openGrammarPdf(group) }.padding(vertical = 11.dp),
                        )
                    }
                    study.pdfError?.let { Text(it, color = c.danger, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) }
                }
            } else {
                Text(
                    "🔒 Grammar chapter PDFs are a Premium feature", color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp)).padding(vertical = 11.dp),
                )
            }
        }

        if (pending) {
            Spacer(Modifier.height(8.dp))
            PrimaryButton("Mark day complete") { vm.completeDay() }
        }
    }
}

@Composable
private fun PrimaryButton(text: String, onClick: () -> Unit) {
    val c = LocalColors.current
    Text(
        text, color = c.onAccent, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.accent).clickable(onClick = onClick).padding(vertical = 14.dp),
    )
}

@Composable
private fun Notice(text: String) {
    val c = LocalColors.current
    Text(
        text, color = c.warnText, fontSize = 12.sp,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp)).background(c.warnSoft).padding(horizontal = 12.dp, vertical = 8.dp),
    )
}

@Composable
private fun ResetControl(study: StudyState, vm: AppViewModel) {
    val c = LocalColors.current
    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        if (!study.confirmingReset) {
            Text("↺ Reset progress", color = c.muted, fontSize = 12.sp, modifier = Modifier.clickable { vm.askReset(true) }.padding(8.dp))
        } else {
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.card)
                    .border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp)).padding(12.dp),
                horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Erase all saved progress?", color = c.text, fontSize = 12.sp)
                Text("Yes, reset", color = c.danger, fontSize = 12.sp, fontWeight = FontWeight.Medium, modifier = Modifier.clickable { vm.doReset() }.padding(6.dp))
                Text("Cancel", color = c.muted, fontSize = 12.sp, modifier = Modifier.clickable { vm.askReset(false) }.padding(6.dp))
            }
        }
    }
}
