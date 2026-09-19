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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.UiState
import com.frenchnclc7.app.data.PlanSection
import com.frenchnclc7.app.data.TOTAL_DAYS
import com.frenchnclc7.app.data.Tier

@Composable
fun HomeScreen(state: UiState, vm: AppViewModel) {
    val c = LocalColors.current
    var jump by rememberSaveable { mutableStateOf("") }

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState())) {
        // Top strip: who is signed in, their tier, log out
        Row(
            Modifier.fillMaxWidth().background(c.card).padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "Signed in as " + (state.username ?: state.session?.email ?: ""),
                color = c.muted, fontSize = 12.sp, modifier = Modifier.weight(1f), maxLines = 1,
            )
            Text(
                state.tier.label, color = c.link, fontSize = 11.sp, fontWeight = FontWeight.Medium,
                modifier = Modifier.clip(RoundedCornerShape(50)).background(c.accentSoft).padding(horizontal = 8.dp, vertical = 3.dp),
            )
            Spacer(Modifier.width(12.dp))
            Text("Log out", color = c.link, fontSize = 12.sp, modifier = Modifier.clickable { vm.signOut() })
        }

        Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            // Theme picker
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Themes.all.forEach { (id, t) ->
                    val selected = state.themeId == id
                    Box(
                        Modifier.size(28.dp).clip(CircleShape).background(t.bg)
                            .border(BorderStroke(if (selected) 3.dp else 1.dp, if (selected) c.accent else c.border), CircleShape)
                            .clickable { vm.setTheme(id) },
                    ) { Box(Modifier.size(10.dp).clip(CircleShape).background(t.accent).align(Alignment.Center)) }
                }
            }
            Spacer(Modifier.height(24.dp))

            Text("A DAILY LANGUAGE JOURNEY", color = c.gold, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
            Spacer(Modifier.height(8.dp))
            Text("French NCLC 7", color = c.text, fontSize = 30.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
            Text("Preparation Plan", color = c.text, fontSize = 30.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
            Spacer(Modifier.height(6.dp))
            Text("From absolute beginner to confident exam readiness", color = c.muted, fontSize = 13.sp, textAlign = TextAlign.Center)

            // "Day N complete" - shown only once Day 1 is complete in every section
            state.completedThrough?.let { done ->
                Spacer(Modifier.height(16.dp))
                if (done > 0) {
                    Text(
                        "Day $done complete", color = c.text, fontSize = 12.sp, fontWeight = FontWeight.Medium,
                        modifier = Modifier.clip(RoundedCornerShape(50)).background(c.accentSoft).padding(horizontal = 12.dp, vertical = 6.dp),
                    )
                    Spacer(Modifier.height(10.dp))
                }
                Box(Modifier.width(200.dp).height(4.dp).clip(RoundedCornerShape(50)).background(c.border)) {
                    Box(Modifier.fillMaxWidth(done.toFloat() / TOTAL_DAYS).height(4.dp).clip(RoundedCornerShape(50)).background(c.accent))
                }
                Spacer(Modifier.height(6.dp))
                Text("$done / $TOTAL_DAYS days", color = c.muted, fontSize = 12.sp)
            }
            Spacer(Modifier.height(24.dp))

            // The five sections
            PlanSection.entries.forEach { section ->
                Row(
                    Modifier.fillMaxWidth().padding(bottom = 10.dp).clip(RoundedCornerShape(16.dp)).background(c.card)
                        .border(BorderStroke(1.dp, c.accent), RoundedCornerShape(16.dp))
                        .clickable { vm.open(section) }.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(section.title, color = c.text, fontSize = 15.sp, fontWeight = FontWeight.Medium)
                        Text(section.tagline, color = c.muted, fontSize = 12.sp)
                    }
                    Text("›", color = c.accent, fontSize = 22.sp)
                }
            }

            // Jump to a day (opens the Anki cards for that day; every section has its own Open button on the day screen)
            Spacer(Modifier.height(10.dp))
            Text("Jump to a day (1–$TOTAL_DAYS)", color = c.muted, fontSize = 12.sp, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(6.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = jump, onValueChange = { jump = it.filter(Char::isDigit).take(3) }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = c.text, unfocusedTextColor = c.text, focusedBorderColor = c.accent,
                        unfocusedBorderColor = c.border, cursorColor = c.accent,
                    ),
                    modifier = Modifier.weight(1f),
                )
                Button(
                    onClick = { jump.toIntOrNull()?.takeIf { it in 1..TOTAL_DAYS }?.let { vm.browseDay(it) } },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = c.accent, contentColor = c.onAccent),
                    modifier = Modifier.height(56.dp),
                ) { Text("Go") }
            }
            // Super users only: manage everyone's tier (the database refuses anyone else too)
            if (state.tier == Tier.SUPER) {
                Spacer(Modifier.height(14.dp))
                Text(
                    "👥 Admin: manage users", color = c.muted, fontSize = 13.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                        .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp))
                        .clickable { vm.openAdmin() }.padding(vertical = 14.dp),
                )
            }
            Spacer(Modifier.height(24.dp))
            Text("~90 minutes a day · Listening · Speaking · Reading · Writing", color = c.muted, fontSize = 11.sp, textAlign = TextAlign.Center)
        }
    }
}
