package com.frenchnclc7.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.WordBankState
import com.frenchnclc7.app.data.Tier
import com.frenchnclc7.app.data.WordBankLogic
import com.frenchnclc7.app.data.WordBankWord

/**
 * The Word Bank (Premium and Super): the person's own list of French words. They join the Anki review cards from
 * the next session. Starter words can be hidden and brought back; words the person added can be edited and deleted.
 */
@Composable
fun WordBankScreen(w: WordBankState, tier: Tier, vm: AppViewModel) {
    val c = LocalColors.current

    if (!tier.atLeast(Tier.PREMIUM)) {
        Column(Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 20.dp)) {
            Header(vm)
            Spacer(Modifier.height(16.dp))
            Text("Word Bank", color = c.text, fontSize = 24.sp, fontFamily = FontFamily.Serif)
            Spacer(Modifier.height(12.dp))
            Column(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card)
                    .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("🔒", fontSize = 26.sp)
                Spacer(Modifier.height(6.dp))
                Text("Word Bank is a Premium feature", color = c.text, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(4.dp))
                Text(
                    "Keep your own list of French words. They join your Anki reviews from your next session.",
                    color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    "See plans", color = c.onAccent, fontSize = 14.sp, fontWeight = FontWeight.Medium,
                    modifier = Modifier.clip(RoundedCornerShape(12.dp)).background(c.accent).clickable { vm.openPlans() }
                        .padding(horizontal = 24.dp, vertical = 12.dp),
                )
            }
        }
        return
    }

    val words = w.words
    val visible = (words ?: emptyList()).filter { !it.hidden }
    val hiddenStarters = (words ?: emptyList()).count { it.hidden && it.starter_id != null }
    val shown = WordBankLogic.filter(WordBankLogic.sortForDisplay(visible), w.query)
    val ownCount = WordBankLogic.ownCount(visible)
    val limit = WordBankLogic.ownLimit(tier)

    LazyColumn(Modifier.fillMaxSize().padding(horizontal = 20.dp), contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 20.dp)) {
        item {
            Header(vm)
            Spacer(Modifier.height(16.dp))
            Text("Word Bank", color = c.text, fontSize = 24.sp, fontFamily = FontFamily.Serif)
            Spacer(Modifier.height(4.dp))
            Text("Your own words. They join the review cards in Anki from your next session.", color = c.muted, fontSize = 12.sp)
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Stat("Words in rotation", visible.size.toString(), Modifier.weight(1f))
                Stat("Words you added", if (tier == Tier.PREMIUM) "$ownCount of $limit" else ownCount.toString(), Modifier.weight(1f))
            }
            Spacer(Modifier.height(14.dp))

            // Add form
            Column(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card)
                    .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(16.dp),
            ) {
                Text("＋ Add a word", color = c.text, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(8.dp))
                Field(w.french, "French, for example le fromage") { vm.wbFrench(it) }
                Spacer(Modifier.height(8.dp))
                Field(w.english, "English, for example cheese") { vm.wbEnglish(it) }
                Spacer(Modifier.height(8.dp))
                Field(w.note, "Note (optional)") { vm.wbNote(it) }
                w.addError?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = c.warnText, fontSize = 12.sp)
                }
                Spacer(Modifier.height(12.dp))
                Text(
                    "Add word", color = c.onAccent, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.accent)
                        .clickable(enabled = !w.busy) { vm.wbAdd() }.padding(vertical = 13.dp),
                )
                w.notice?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                }
            }
            Spacer(Modifier.height(14.dp))
            Field(w.query, "Search your words") { vm.wbQuery(it) }
            Spacer(Modifier.height(10.dp))

            if (words == null) {
                Text("Loading your words…", color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(24.dp))
            } else if (w.loadError) {
                Row(Modifier.padding(vertical = 8.dp)) {
                    Text("Couldn't load your words. ", color = c.warnText, fontSize = 12.sp)
                    Text("Retry", color = c.link, fontSize = 12.sp, modifier = Modifier.clickable { vm.loadWordBank() })
                }
            } else if (shown.isEmpty()) {
                Text(
                    if (w.query.isNotBlank()) "No words match that search." else "No words yet. Add your first one above.",
                    color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(24.dp),
                )
            }
        }

        items(shown.take(w.showCount), key = { it.id }) { word ->
            Spacer(Modifier.height(8.dp))
            if (w.editingId == word.id) EditRow(w, word, vm) else WordRow(w, word, vm)
        }

        item {
            if (shown.size > w.showCount) {
                Spacer(Modifier.height(10.dp))
                Text(
                    "Show more (${shown.size - w.showCount} left)", color = c.link, fontSize = 12.sp, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp))
                        .clickable { vm.wbShowMore() }.padding(vertical = 12.dp),
                )
            }
            Spacer(Modifier.height(20.dp))
            if (w.confirmReset) {
                Text(
                    "Bring back hidden starter words and undo edits to them? Words you added stay as they are.",
                    color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth(),
                )
                Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                    Text("Reset", color = c.link, fontSize = 13.sp, modifier = Modifier.clickable(enabled = !w.busy) { vm.wbReset() }.padding(8.dp))
                    Text("Cancel", color = c.muted, fontSize = 13.sp, modifier = Modifier.clickable { vm.wbAskReset(false) }.padding(8.dp))
                }
            } else {
                Text(
                    "↺ Reset starter words" + if (hiddenStarters > 0) " ($hiddenStarters hidden)" else "",
                    color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clickable { vm.wbAskReset(true) }.padding(8.dp),
                )
            }
        }
    }
}

@Composable
private fun Header(vm: AppViewModel) {
    val c = LocalColors.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text("‹", color = c.muted, fontSize = 24.sp, modifier = Modifier.clickable { vm.home() }.padding(end = 10.dp))
        Text("Word Bank", color = c.muted, fontSize = 12.sp)
    }
}

@Composable
private fun Stat(label: String, value: String, modifier: Modifier) {
    val c = LocalColors.current
    Column(modifier.clip(RoundedCornerShape(12.dp)).background(c.card).border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp)).padding(12.dp)) {
        Text(label, color = c.muted, fontSize = 12.sp)
        Text(value, color = c.text, fontSize = 18.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun Field(value: String, placeholder: String, onChange: (String) -> Unit) {
    val c = LocalColors.current
    OutlinedTextField(
        value = value, onValueChange = onChange, singleLine = true,
        placeholder = { Text(placeholder, color = c.muted, fontSize = 13.sp) },
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = c.text, unfocusedTextColor = c.text, focusedBorderColor = c.accent,
            unfocusedBorderColor = c.border, cursorColor = c.accent,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun WordRow(w: WordBankState, word: WordBankWord, vm: AppViewModel) {
    val c = LocalColors.current
    val own = WordBankLogic.isOwn(word)
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.card).border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Column(Modifier.weight(1f)) {
            Text(word.french, color = c.text, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            Text(word.english + (word.note?.let { " · $it" } ?: ""), color = c.muted, fontSize = 12.sp)
            Text(
                if (own) "Mine" else "Starter", color = c.link, fontSize = 10.sp,
                modifier = Modifier.padding(top = 4.dp).clip(RoundedCornerShape(50)).background(c.accentSoft).padding(horizontal = 8.dp, vertical = 2.dp),
            )
        }
        if (w.confirmId == word.id) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (own) "Delete" else "Hide", color = c.warnText, fontSize = 12.sp, modifier = Modifier.clickable(enabled = !w.busy) { vm.wbRemove(word) }.padding(8.dp))
                Text("Keep", color = c.muted, fontSize = 12.sp, modifier = Modifier.clickable { vm.wbAskDelete(null) }.padding(8.dp))
            }
        } else {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("✎", color = c.muted, fontSize = 18.sp, modifier = Modifier.clickable { vm.wbStartEdit(word) }.padding(8.dp))
                Text("🗑", color = c.muted, fontSize = 16.sp, modifier = Modifier.clickable {
                    if (own) vm.wbAskDelete(word.id) else vm.wbRemove(word)
                }.padding(8.dp))
            }
        }
    }
}

@Composable
private fun EditRow(w: WordBankState, word: WordBankWord, vm: AppViewModel) {
    val c = LocalColors.current
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.card).border(BorderStroke(1.dp, c.accent), RoundedCornerShape(12.dp)).padding(12.dp)) {
        Field(w.editFrench, "French") { vm.wbEditFrench(it) }
        Spacer(Modifier.height(8.dp))
        Field(w.editEnglish, "English") { vm.wbEditEnglish(it) }
        Spacer(Modifier.height(8.dp))
        Field(w.editNote, "Note (optional)") { vm.wbEditNote(it) }
        w.editError?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = c.warnText, fontSize = 12.sp)
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                "Save", color = c.onAccent, fontSize = 13.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).background(c.accent)
                    .clickable(enabled = !w.busy) { vm.wbSaveEdit(word) }.padding(vertical = 10.dp),
            )
            Text(
                "Cancel", color = c.muted, fontSize = 13.sp, textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).border(BorderStroke(1.dp, c.border), RoundedCornerShape(10.dp))
                    .clickable { vm.wbCancelEdit() }.padding(vertical = 10.dp),
            )
        }
    }
}
