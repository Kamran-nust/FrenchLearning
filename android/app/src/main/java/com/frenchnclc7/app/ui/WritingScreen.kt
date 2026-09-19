package com.frenchnclc7.app.ui

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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.FeedbackUi
import com.frenchnclc7.app.SaveState
import com.frenchnclc7.app.StudyPhase
import com.frenchnclc7.app.WritingState
import com.frenchnclc7.app.data.DayContent
import com.frenchnclc7.app.data.FeedbackMarkdown
import com.frenchnclc7.app.data.PlanSection
import com.frenchnclc7.app.data.TOTAL_DAYS
import com.frenchnclc7.app.data.WritingLogic
import java.time.Instant
import kotlinx.coroutines.delay

/**
 * The Writing section: read the day's task, write in French, get AI feedback (within your daily
 * allowance), mark the day complete. Entries and progress are saved in the same format as the web app.
 */
@Composable
fun WritingScreen(w: WritingState, vm: AppViewModel) {
    val c = LocalColors.current

    if (w.loading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Loading your session…", color = c.muted, fontSize = 14.sp)
        }
        return
    }

    val days = remember { vm.plan.days(PlanSection.WRITING) }
    val viewed = days.firstOrNull { it.day == w.viewDay }
    val done = w.progress.completed_days.size

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding()) {
        // Header: back, where you are, streak, progress bar
        Column(Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("‹", color = c.muted, fontSize = 24.sp, modifier = Modifier.clickable { vm.back() }.padding(end = 10.dp))
                Text(
                    if (w.phase == StudyPhase.FINISHED) "Writing plan complete" else "Day ${w.viewDay} of $TOTAL_DAYS",
                    color = c.muted, fontSize = 12.sp, modifier = Modifier.weight(1f),
                )
                Text(
                    "🔥 " + w.progress.streak_count,
                    color = if (w.progress.streak_count > 0) c.text else c.muted, fontSize = 12.sp, fontWeight = FontWeight.Medium,
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

        if (w.loadFailed) {
            WritingNotice("Couldn't load your saved progress and writing, so nothing will be saved this session (to protect what you already have). Check your connection and reopen Writing.")
        } else if (w.saveFailed) {
            WritingNotice("Your writing isn't saving right now — it may be lost if you close the app.")
        }

        when (w.phase) {
            StudyPhase.FINISHED -> Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("✓", color = c.success, fontSize = 40.sp)
                Spacer(Modifier.height(12.dp))
                Text("All $TOTAL_DAYS days done", color = c.text, fontSize = 24.sp)
                Spacer(Modifier.height(6.dp))
                Text("Longest streak: ${w.progress.longest_streak} days. The writing module is finished.", color = c.muted, fontSize = 14.sp, textAlign = TextAlign.Center)
            }

            StudyPhase.COMPLETE -> Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("✓", color = c.success, fontSize = 40.sp)
                Spacer(Modifier.height(12.dp))
                Text("Day ${w.completion?.day ?: ""} done", color = c.text, fontSize = 24.sp)
                Spacer(Modifier.height(4.dp))
                Text("${w.completion?.remaining ?: 0} days left · streak ${w.completion?.streak ?: 0}", color = c.muted, fontSize = 14.sp)
                Spacer(Modifier.height(24.dp))
                WritingButton("Start next day", filled = true) { vm.continueWriting() }
            }

            StudyPhase.DAY -> if (viewed == null) {
                Text("Nothing to show.", color = c.muted, fontSize = 14.sp, modifier = Modifier.padding(24.dp))
            } else {
                WritingDay(w, viewed, vm)
            }
        }

        WritingReset(w, vm)
    }
}

@Composable
private fun WritingDay(w: WritingState, viewed: DayContent, vm: AppViewModel) {
    val c = LocalColors.current
    // The text box owns what is typed; the view model keeps a copy and saves it a second after typing stops.
    var draft by remember(w.viewDay, w.resetCount) { mutableStateOf(w.entries[w.viewDay]?.text ?: "") }
    var now by remember { mutableStateOf(Instant.now()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(30_000)
            now = Instant.now()
        }
    }

    val target = WritingLogic.extractWordTarget(viewed.text)
    val count = WritingLogic.countWords(draft)
    val quota = w.quota
    val limitReached = quota?.limitReached(now) == true
    val canAsk = draft.isNotBlank() && w.feedback != FeedbackUi.LOADING && !limitReached
    val feedbackText = w.entries[w.viewDay]?.feedback
    val pending = w.viewDay == w.progress.current_day && w.progress.current_day <= TOTAL_DAYS

    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp)) {
        if (w.viewDay != w.progress.current_day) {
            Text(
                "Your current day is Day ${minOf(w.progress.current_day, TOTAL_DAYS)} — you can still edit this entry.",
                color = c.muted, fontSize = 12.sp, modifier = Modifier.padding(bottom = 8.dp),
            )
        }

        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card)
                .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(viewed.text, color = c.text, fontSize = 15.sp, lineHeight = 22.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())

            Column {
                OutlinedTextField(
                    value = draft,
                    onValueChange = { draft = it; vm.writingDraftChanged(it) },
                    placeholder = { Text("Écrivez ici…", color = c.muted) },
                    minLines = 6,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = c.text, unfocusedTextColor = c.text,
                        focusedBorderColor = c.accent, unfocusedBorderColor = c.border,
                        focusedContainerColor = c.bg, unfocusedContainerColor = c.bg, cursorColor = c.accent,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(Modifier.fillMaxWidth().padding(top = 6.dp, start = 2.dp, end = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (target != null) "$count / $target words" else "$count words", color = c.muted, fontSize = 12.sp)
                    Text(
                        when (w.saveState) { SaveState.SAVING -> "Saving…"; SaveState.SAVED -> "Saved"; SaveState.IDLE -> "" },
                        color = c.muted, fontSize = 12.sp,
                    )
                }
            }

            Text(
                if (w.feedback == FeedbackUi.LOADING) "✦ Getting feedback…" else "✦ Get feedback",
                color = c.gold, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(if (canAsk) c.accentSoft else c.accentSoft.copy(alpha = c.accentSoft.alpha * 0.5f))
                    .clickable(enabled = canAsk) { vm.getWritingFeedback() }.padding(vertical = 10.dp),
            )

            if (limitReached && quota != null) {
                Text(
                    "Daily AI feedback limit reached. Next one available in ${WritingLogic.formatWait(quota.millisUntilReset(now))}.",
                    color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
                )
            } else if (quota != null && quota.limit != null) {
                Text(
                    "${quota.remaining ?: 0} of ${quota.limit} AI feedback${if (quota.limit == 1) "" else "s"} left",
                    color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
                )
            }

            if (w.feedback == FeedbackUi.BUSY) {
                Text(
                    "The AI is busy right now. Try again in a minute — that didn't use any of your allowance.",
                    color = c.danger, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
                )
            } else if (w.feedback == FeedbackUi.FAILED) {
                Text(
                    "Couldn't get feedback — check your connection and try again.",
                    color = c.danger, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
                )
            }

            if (!feedbackText.isNullOrBlank() && w.feedback != FeedbackUi.LOADING) {
                Box(Modifier.fillMaxWidth().height(1.dp).background(c.border))
                Column(Modifier.fillMaxWidth()) {
                    Text("✦ Feedback", color = c.gold, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        buildAnnotatedString {
                            FeedbackMarkdown.pieces(feedbackText).forEach { p ->
                                pushStyle(SpanStyle(fontWeight = if (p.bold) FontWeight.Bold else null, fontStyle = if (p.italic) FontStyle.Italic else null))
                                append(p.text)
                                pop()
                            }
                        },
                        color = c.text, fontSize = 14.sp, lineHeight = 21.sp,
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        Row(Modifier.fillMaxWidth()) {
            val prev = w.viewDay > 1
            val next = w.viewDay < TOTAL_DAYS
            Text(
                "‹ Previous", color = if (prev) c.link else c.muted, fontSize = 14.sp,
                modifier = Modifier.weight(1f).clickable(enabled = prev) { vm.writingMove(-1) }.padding(8.dp),
            )
            Text(
                "Next ›", color = if (next) c.link else c.muted, fontSize = 14.sp, textAlign = TextAlign.End,
                modifier = Modifier.weight(1f).clickable(enabled = next) { vm.writingMove(1) }.padding(8.dp),
            )
        }

        if (pending) {
            Spacer(Modifier.height(8.dp))
            WritingButton("Mark day complete", filled = true) { vm.completeWritingDay() }
        }
    }
}

@Composable
private fun WritingButton(text: String, filled: Boolean, onClick: () -> Unit) {
    val c = LocalColors.current
    Text(
        text, color = if (filled) c.onAccent else c.text, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(if (filled) c.accent else c.card)
            .clickable(onClick = onClick).padding(vertical = 14.dp),
    )
}

@Composable
private fun WritingNotice(text: String) {
    val c = LocalColors.current
    Text(
        text, color = c.warnText, fontSize = 12.sp,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp)).background(c.warnSoft).padding(horizontal = 12.dp, vertical = 8.dp),
    )
}

@Composable
private fun WritingReset(w: WritingState, vm: AppViewModel) {
    val c = LocalColors.current
    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        if (!w.confirmingReset) {
            Text("↺ Reset progress", color = c.muted, fontSize = 12.sp, modifier = Modifier.clickable { vm.askWritingReset(true) }.padding(8.dp))
        } else {
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.card)
                    .border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp)).padding(12.dp),
                horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Erase all saved progress and writing?", color = c.text, fontSize = 12.sp, modifier = Modifier.weight(1f))
                Text("Yes, reset", color = c.danger, fontSize = 12.sp, fontWeight = FontWeight.Medium, modifier = Modifier.clickable { vm.doWritingReset() }.padding(6.dp))
                Text("Cancel", color = c.muted, fontSize = 12.sp, modifier = Modifier.clickable { vm.askWritingReset(false) }.padding(6.dp))
            }
        }
    }
}
