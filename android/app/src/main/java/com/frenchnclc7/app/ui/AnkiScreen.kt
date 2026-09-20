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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AnkiState
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.StudyPhase
import com.frenchnclc7.app.data.AnkiLimits
import com.frenchnclc7.app.data.Direction
import com.frenchnclc7.app.data.Tier
import com.frenchnclc7.app.data.TOTAL_DAYS

/**
 * The Anki flashcards: today's new words (French to English) followed by review words from earlier
 * days (random direction), with pronunciation, "hard" flags, a streak and bonus practice rounds.
 */
@Composable
fun AnkiScreen(a: AnkiState, tier: Tier, vm: AppViewModel) {
    val c = LocalColors.current
    val limit = AnkiLimits.dailyLimit(tier)

    if (a.loading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Loading your session…", color = c.muted, fontSize = 14.sp)
        }
        return
    }

    val session = a.session
    val item = if (a.phase == StudyPhase.DAY && session != null) session.items.getOrNull(a.index) else null

    // French shown as the prompt is spoken as soon as the card appears; when English is the prompt,
    // the French answer is spoken once it is revealed.
    LaunchedEffect(item?.key) {
        if (item != null && item.dir == Direction.FE) vm.speak(item.french)
    }
    LaunchedEffect(item?.key, a.revealed) {
        if (item != null && item.dir == Direction.EF && a.revealed) vm.speak(item.french)
    }

    val done = a.progress.completed_days.size

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        // Header: back, where you are, streak, progress bar
        Column(Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("‹", color = c.muted, fontSize = 24.sp, modifier = Modifier.clickable { vm.back() }.padding(end = 10.dp))
                Text(
                    when {
                        a.phase == StudyPhase.FINISHED -> "Plan complete"
                        a.practice && session != null -> "Practicing Day ${session.dayNumber} of $TOTAL_DAYS"
                        else -> "Day ${minOf(a.progress.current_day, TOTAL_DAYS)} of $TOTAL_DAYS"
                    },
                    color = c.muted, fontSize = 12.sp, modifier = Modifier.weight(1f),
                )
                Text(
                    "🔥 " + a.progress.streak_count,
                    color = if (a.progress.streak_count > 0) c.text else c.muted, fontSize = 12.sp, fontWeight = FontWeight.Medium,
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

        if (a.loadFailed) {
            AnkiNotice("Couldn't load your saved progress, so nothing will be saved this session (to protect what you already have). Check your connection and reopen Anki.")
        } else if (a.saveFailed) {
            AnkiNotice("Progress isn't saving right now — it may be lost if you close the app.")
        }

        when {
            a.limitHit -> Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("🔒", fontSize = 36.sp)
                Spacer(Modifier.height(12.dp))
                Text("Today's limit reached", color = c.text, fontSize = 24.sp, fontFamily = FontFamily.Serif)
                Spacer(Modifier.height(8.dp))
                Text(
                    "You've seen ${limit ?: 0} words today. Your limit resets tomorrow" +
                        (if (tier == Tier.FREE) ", and Premium raises it to ${AnkiLimits.PREMIUM_DAILY} words a day." else "."),
                    color = c.muted, fontSize = 14.sp, textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(24.dp))
                if (tier == Tier.FREE) {
                    AnkiButton("See plans", filled = true) { vm.openPlans() }
                    Spacer(Modifier.height(10.dp))
                }
                AnkiButton("Back to home", filled = false) { vm.home() }
            }

            a.phase == StudyPhase.FINISHED -> Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("✓", color = c.success, fontSize = 40.sp)
                Spacer(Modifier.height(12.dp))
                Text("All $TOTAL_DAYS days done", color = c.text, fontSize = 24.sp)
                Spacer(Modifier.height(6.dp))
                Text("Longest streak: ${a.progress.longest_streak} days. The vocabulary module is finished — nice work.", color = c.muted, fontSize = 14.sp, textAlign = TextAlign.Center)
            }

            a.phase == StudyPhase.COMPLETE && a.completion != null -> Column(
                Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("✓", color = c.success, fontSize = 40.sp)
                Spacer(Modifier.height(12.dp))
                Text("Day ${a.completion.day} done", color = c.text, fontSize = 24.sp)
                Spacer(Modifier.height(4.dp))
                Text("${a.completion.remaining} days left · streak ${a.completion.streak}", color = c.muted, fontSize = 14.sp)
                Spacer(Modifier.height(24.dp))
                AnkiButton("Start next day", filled = true) { vm.ankiContinueToNextDay() }
                Spacer(Modifier.height(10.dp))
                AnkiButton("Practice this day again", filled = false) { vm.ankiPracticeAgain(a.completion.day) }
            }

            item == null || session == null -> Text("Nothing to show.", color = c.muted, fontSize = 14.sp, modifier = Modifier.padding(24.dp))

            else -> Card(a, item, session.items.size, session.dayNumber, limit, vm)
        }

        // Reset
        Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            if (!a.confirmingReset) {
                Text("↺ Reset progress", color = c.muted, fontSize = 12.sp, modifier = Modifier.clickable { vm.ankiAskReset(true) }.padding(8.dp))
            } else {
                Row(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.card)
                        .border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp)).padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Erase all saved progress?", color = c.text, fontSize = 12.sp)
                    Text("Yes, reset", color = c.danger, fontSize = 12.sp, fontWeight = FontWeight.Medium, modifier = Modifier.clickable { vm.ankiDoReset() }.padding(6.dp))
                    Text("Cancel", color = c.muted, fontSize = 12.sp, modifier = Modifier.clickable { vm.ankiAskReset(false) }.padding(6.dp))
                }
            }
        }
    }
}

@Composable
private fun Card(a: AnkiState, item: com.frenchnclc7.app.data.AnkiItem, total: Int, sessionDay: Int, limit: Int?, vm: AppViewModel) {
    val c = LocalColors.current
    val isHard = item.cardId in a.hard
    val prompt = if (item.dir == Direction.EF) item.english else item.french
    val answer = if (item.dir == Direction.EF) item.french else item.english
    val isLast = a.index + 1 >= total
    val isFirst = a.index == 0
    val isReview = item.sourceDay != sessionDay

    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp)) {
        if (limit != null) {
            Text(
                "Words today: ${minOf(a.dailySeen, limit)} of $limit", color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
            )
        }
        Row(Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(
                if (item.dir == Direction.EF) "English → French" else "French → English",
                color = c.link, fontSize = 11.sp,
                modifier = Modifier.clip(RoundedCornerShape(50)).background(c.accentSoft).padding(horizontal = 10.dp, vertical = 4.dp),
            )
            Text("${a.index + 1} / $total" + (if (item.custom) " · my word" else if (isReview) " · review" else " · new"), color = c.muted, fontSize = 12.sp)
        }
        Spacer(Modifier.height(8.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            RoundButton("‹", enabled = !isFirst, filled = false) { vm.ankiPrevious() }
            Box(
                Modifier.weight(1f).padding(horizontal = 10.dp).clip(RoundedCornerShape(16.dp)).background(c.card)
                    .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)),
            ) {
                // "Hard" flag
                Text(
                    "⚑", color = if (isHard) c.hard else c.muted, fontSize = 20.sp,
                    modifier = Modifier.align(Alignment.TopEnd).padding(8.dp).clip(CircleShape)
                        .background(if (isHard) c.hard.copy(alpha = 0.14f) else c.card)
                        .clickable { vm.ankiToggleHard(item.cardId) }.padding(horizontal = 8.dp, vertical = 2.dp),
                )
                Column(
                    Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 48.dp),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
                ) {
                    Text(prompt, color = c.text, fontSize = 30.sp, lineHeight = 38.sp, fontFamily = FontFamily.Serif, textAlign = TextAlign.Center)
                    if (item.dir == Direction.FE && !a.revealed) {
                        Text("🔊 Replay", color = c.muted, fontSize = 12.sp, modifier = Modifier.clickable { vm.speak(item.french) }.padding(top = 8.dp, bottom = 4.dp))
                    }
                    if (a.revealed) {
                        Spacer(Modifier.height(20.dp))
                        Box(Modifier.fillMaxWidth().height(1.dp).background(c.border))
                        Spacer(Modifier.height(20.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                            Text(answer, color = c.text, fontSize = 24.sp, fontFamily = FontFamily.Serif, textAlign = TextAlign.Center)
                            if (item.dir == Direction.EF) {
                                Text("🔊", fontSize = 16.sp, modifier = Modifier.clickable { vm.speak(item.french) }.padding(start = 10.dp))
                            }
                        }
                    }
                }
            }
            RoundButton(if (isLast) "✓" else "›", enabled = true, filled = true) { vm.ankiNext() }
        }

        Spacer(Modifier.height(16.dp))
        Text(
            if (a.revealed) "Answer shown" else "Show answer",
            color = if (a.revealed) c.muted else c.text, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp))
                .clickable(enabled = !a.revealed) { vm.ankiShowAnswer() }.padding(vertical = 14.dp),
        )
    }
}

@Composable
private fun RoundButton(label: String, enabled: Boolean, filled: Boolean, onClick: () -> Unit) {
    val c = LocalColors.current
    Box(
        Modifier.size(40.dp).clip(CircleShape).background(if (filled) c.accent else c.card)
            .border(BorderStroke(1.dp, if (filled) c.accent else c.border), CircleShape)
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = if (filled) c.onAccent else if (enabled) c.text else c.muted, fontSize = 18.sp)
    }
}

@Composable
private fun AnkiButton(text: String, filled: Boolean, onClick: () -> Unit) {
    val c = LocalColors.current
    Text(
        text, color = if (filled) c.onAccent else c.muted, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(if (filled) c.accent else c.bg)
            .border(BorderStroke(1.dp, if (filled) c.accent else c.border), RoundedCornerShape(12.dp))
            .clickable(onClick = onClick).padding(vertical = 14.dp),
    )
}

@Composable
private fun AnkiNotice(text: String) {
    val c = LocalColors.current
    Text(
        text, color = c.warnText, fontSize = 12.sp,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp)).background(c.warnSoft).padding(horizontal = 12.dp, vertical = 8.dp),
    )
}
