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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AdminState
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.data.AdminLogic
import com.frenchnclc7.app.data.AdminUser
import com.frenchnclc7.app.data.Tier

/**
 * Users and their tiers, for super users: search, see who is on which tier and how active they are,
 * and change a tier. Every change is checked by the database, so this screen is only a convenience.
 */
@Composable
fun AdminScreen(a: AdminState, myId: String?, vm: AppViewModel) {
    val c = LocalColors.current

    val users = a.users
    val shown = if (users == null) emptyList() else AdminLogic.filter(users, a.query)

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 20.dp, vertical = 20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("‹", color = c.muted, fontSize = 24.sp, modifier = Modifier.clickable { vm.home() }.padding(end = 10.dp))
            Text("Admin", color = c.muted, fontSize = 12.sp)
        }
        Spacer(Modifier.height(20.dp))
        Text("Users", color = c.text, fontSize = 24.sp, fontFamily = FontFamily.Serif)
        Spacer(Modifier.height(4.dp))
        Text("Change what each person can use. Changes apply the next time they open the app.", color = c.muted, fontSize = 12.sp)
        Spacer(Modifier.height(14.dp))

        if (!users.isNullOrEmpty()) {
            val counts = AdminLogic.counts(users)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Tier.entries.forEach { t ->
                    Text(
                        "${counts[t] ?: 0} ${t.label.lowercase()}", color = c.text, fontSize = 12.sp,
                        modifier = Modifier.clip(RoundedCornerShape(50)).background(c.accentSoft).padding(horizontal = 10.dp, vertical = 4.dp),
                    )
                }
            }
            Spacer(Modifier.height(14.dp))
        }

        OutlinedTextField(
            value = a.query, onValueChange = { vm.setAdminQuery(it) }, singleLine = true,
            placeholder = { Text("Search by email or username", color = c.muted, fontSize = 13.sp) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = c.text, unfocusedTextColor = c.text, focusedBorderColor = c.accent,
                unfocusedBorderColor = c.border, focusedContainerColor = c.card, unfocusedContainerColor = c.card, cursorColor = c.accent,
            ),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(14.dp))

        if (users == null && a.loadError == null) {
            Text("Loading users…", color = c.muted, fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp))
        }
        a.loadError?.let {
            Row(Modifier.padding(bottom = 10.dp)) {
                Text(it + " ", color = c.danger, fontSize = 12.sp)
                Text("Retry", color = c.danger, fontSize = 12.sp, modifier = Modifier.clickable { vm.loadAdminUsers() })
            }
        }
        if (!users.isNullOrEmpty() && shown.isEmpty()) {
            Text("No one matches \"${a.query}\".", color = c.muted, fontSize = 12.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp))
        }

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            shown.forEach { u -> UserCard(u, isMe = u.userId == myId, saving = u.userId in a.saving, error = a.rowErrors[u.userId], vm = vm) }
        }
    }

    // Asked before making someone a super user
    a.confirmSuper?.let { u ->
        AlertDialog(
            onDismissRequest = { vm.cancelPromotion() },
            containerColor = c.card,
            title = { Text("Make super user?", color = c.text, fontSize = 17.sp) },
            text = { Text(AdminLogic.confirmText(u), color = c.muted, fontSize = 14.sp) },
            confirmButton = { Text("Make super", color = c.danger, fontWeight = FontWeight.Medium, modifier = Modifier.clickable { vm.confirmPromotion() }.padding(12.dp)) },
            dismissButton = { Text("Cancel", color = c.muted, modifier = Modifier.clickable { vm.cancelPromotion() }.padding(12.dp)) },
        )
    }
}

@Composable
private fun UserCard(u: AdminUser, isMe: Boolean, saving: Boolean, error: String?, vm: AppViewModel) {
    val c = LocalColors.current
    val locked = AdminLogic.isLocked(u, if (isMe) u.userId else null, saving)
    var open by remember { mutableStateOf(false) }

    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(c.card)
            .border(BorderStroke(1.dp, c.border), RoundedCornerShape(16.dp)).padding(16.dp),
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Row {
                    Text(u.displayName, color = c.text, fontSize = 14.sp, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f, fill = false))
                    if (isMe) Text("  (you)", color = c.muted, fontSize = 12.sp)
                }
                if (u.username != null && u.email != null) {
                    Text(u.email, color = c.muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            Spacer(Modifier.width(10.dp))
            // Tier selector: your own row is locked, and a row is locked while it is being saved
            Box {
                Text(
                    (if (saving) "… " else "") + u.tier.label + "  ▾",
                    color = if (locked) c.muted else c.text, fontSize = 12.sp,
                    modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(c.bg)
                        .border(BorderStroke(1.dp, c.border), RoundedCornerShape(8.dp))
                        .clickable(enabled = !locked) { open = true }.padding(horizontal = 10.dp, vertical = 7.dp),
                )
                DropdownMenu(expanded = open, onDismissRequest = { open = false }, containerColor = c.card) {
                    Tier.entries.forEach { t ->
                        DropdownMenuItem(
                            text = { Text(t.label, color = if (t == u.tier) c.accent else c.text, fontSize = 13.sp) },
                            onClick = { open = false; vm.requestTierChange(u, t) },
                        )
                    }
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(AdminLogic.activityLine(u), color = c.muted, fontSize = 12.sp)
        error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = c.danger, fontSize = 12.sp)
        }
    }
}
