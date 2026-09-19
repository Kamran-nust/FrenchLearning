package com.frenchnclc7.app.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.DayPlanState
import com.frenchnclc7.app.data.DayPlanLogic
import com.frenchnclc7.app.data.Tier
import java.time.Instant
import kotlinx.coroutines.delay

/**
 * "Download Day N plan (PDF)" for premium (1 per rolling 24 hours) and super (unlimited). Free accounts see
 * a lock note. The limit itself is enforced by the database; this button just reflects it.
 */
@Composable
fun DayPlanDownload(day: Int, tier: Tier, state: DayPlanState, vm: AppViewModel) {
    val c = LocalColors.current

    if (!tier.atLeast(Tier.PREMIUM)) {
        Text(
            "🔒 Day plan PDF download is a Premium feature", color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 20.dp).fillMaxWidth().clip(RoundedCornerShape(16.dp))
                .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(vertical = 14.dp),
        )
        return
    }

    // The person picks where to save the file (works on every Android version, no storage permission needed).
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/pdf")) { uri ->
        if (uri != null) vm.writeDayPlanPdf(uri) else vm.cancelDayPlanPdf()
    }
    LaunchedEffect(state.ready) {
        state.ready?.let { launcher.launch(it.fileName) }
    }
    LaunchedEffect(Unit) { vm.loadPdfQuota() }

    // Keeps "Available again in ..." fresh, and brings the button back when the wait is over.
    var now by remember { mutableStateOf(Instant.now()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(60_000)
            now = Instant.now()
        }
    }
    LaunchedEffect(state.quota) {
        val q = state.quota
        if (q != null && !q.allowed && q.resetsAt != null) {
            delay(maxOf(q.millisUntilReset(), 0L) + 1000L)
            vm.loadPdfQuota()
        }
    }

    val usedUp = state.quota?.allowed == false
    val disabled = state.busy || state.ready != null || usedUp || state.quota == null

    Column(Modifier.padding(top = 20.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            if (state.busy) "Preparing PDF…" else "⬇ Download Day $day plan (PDF)",
            color = if (disabled) c.muted else c.onAccent, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                .background(if (disabled) c.card else c.accent)
                .border(BorderStroke(1.dp, if (disabled) c.border else c.accent), RoundedCornerShape(16.dp))
                .clickable(enabled = !disabled) { vm.requestDayPlanPdf(day) }.padding(vertical = 14.dp),
        )
        if (usedUp) {
            Spacer(Modifier.height(8.dp))
            val q = state.quota
            Text(
                if (q?.resetsAt != null) DayPlanLogic.waitText(q, now) else "Not available right now.",
                color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center,
            )
        }
        state.error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = c.danger, fontSize = 12.sp, textAlign = TextAlign.Center)
        }
    }
}
