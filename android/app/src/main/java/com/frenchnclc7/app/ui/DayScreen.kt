package com.frenchnclc7.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.DayPlanState
import com.frenchnclc7.app.data.Tier
import com.frenchnclc7.app.Screen
import com.frenchnclc7.app.data.PlanSection
import com.frenchnclc7.app.data.TOTAL_DAYS

/** Read-only view of one day of one section, with previous/next and a way to switch section. */
@Composable
fun DayScreen(screen: Screen.Day, tier: Tier, dayPlan: DayPlanState, vm: AppViewModel) {
    val c = LocalColors.current
    val days = remember(screen.section) { vm.plan.days(screen.section) }
    val day = days.first { it.day == screen.day.coerceIn(1, TOTAL_DAYS) }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("‹ Home", color = c.link, fontSize = 13.sp, modifier = Modifier.clickable { vm.home() }.padding(end = 12.dp, top = 4.dp, bottom = 4.dp))
            Text("${screen.section.title} · Day ${day.day} of $TOTAL_DAYS · Week ${day.week}", color = c.muted, fontSize = 12.sp)
        }
        Spacer(Modifier.height(16.dp))

        // Switch between the five sections for the same day
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
            PlanSection.entries.forEach { s ->
                val selected = s == screen.section
                Text(
                    s.title, fontSize = 11.sp, fontWeight = FontWeight.Medium,
                    color = if (selected) c.onAccent else c.link,
                    modifier = Modifier.padding(end = 6.dp).clip(RoundedCornerShape(50))
                        .background(if (selected) c.accent else c.accentSoft)
                        .clickable { if (s == PlanSection.ANKI) vm.browseDay(day.day) else vm.open(s, day.day) }.padding(horizontal = 10.dp, vertical = 6.dp),
                )
            }
        }
        Spacer(Modifier.height(16.dp))

        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card)
                .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            day.badge?.let {
                Text(
                    it, color = c.link, fontSize = 11.sp, fontWeight = FontWeight.Medium,
                    modifier = Modifier.clip(RoundedCornerShape(50)).background(c.accentSoft).padding(horizontal = 10.dp, vertical = 4.dp),
                )
                Spacer(Modifier.height(12.dp))
            }
            if (screen.section == PlanSection.ANKI) {
                Text(day.text, color = c.muted, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
                day.cards.forEach { card ->
                    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                        Text(card.f, color = c.text, fontSize = 15.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                        Spacer(Modifier.width(12.dp))
                        Text(card.e, color = c.muted, fontSize = 14.sp, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
                    }
                }
            } else {
                Text(day.text, color = c.text, fontSize = 15.sp, lineHeight = 22.sp)
            }
        }
        if (screen.section == PlanSection.ANKI) {
            Spacer(Modifier.height(14.dp))
            Text(
                "Practice this day's flashcards", color = c.onAccent, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.accent)
                    .clickable { vm.open(PlanSection.ANKI, day.day) }.padding(vertical = 14.dp),
            )
        }
        Spacer(Modifier.height(20.dp))

        Row(Modifier.fillMaxWidth()) {
            val prev = day.day > 1
            val next = day.day < TOTAL_DAYS
            Text(
                "‹ Previous", color = if (prev) c.link else c.muted, fontSize = 14.sp,
                modifier = Modifier.weight(1f).clickable(enabled = prev) { vm.browseDay(day.day - 1) }.padding(8.dp),
            )
            Text(
                "Next ›", color = if (next) c.link else c.muted, fontSize = 14.sp, textAlign = TextAlign.End,
                modifier = Modifier.weight(1f).clickable(enabled = next) { vm.browseDay(day.day + 1) }.padding(8.dp),
            )
        }

        DayPlanDownload(day.day, tier, dayPlan, vm)
    }
}
