package com.frenchnclc7.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.DeleteAccountState
import com.frenchnclc7.app.data.AccountLogic
import com.frenchnclc7.app.data.Tier

/** Deleting your own account: a warning, a typed confirmation and the password. Not offered to Super accounts. */
@Composable
fun DeleteAccountScreen(d: DeleteAccountState, tier: Tier, vm: AppViewModel) {
    val c = LocalColors.current
    val ready = AccountLogic.canConfirmDelete(d.typed, d.password) && !d.busy
    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = c.text, unfocusedTextColor = c.text, focusedBorderColor = c.accent,
        unfocusedBorderColor = c.border, cursorColor = c.accent,
    )

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().padding(horizontal = 20.dp, vertical = 20.dp)) {
        if (!d.done) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("‹", color = c.muted, fontSize = 24.sp, modifier = Modifier.clickable { vm.home() }.padding(end = 10.dp))
                Text("Account", color = c.muted, fontSize = 12.sp)
            }
            Spacer(Modifier.height(16.dp))
        }
        Text(if (d.done) "Account deleted" else "Delete your account", color = c.text, fontSize = 24.sp, fontFamily = FontFamily.Serif)
        Spacer(Modifier.height(10.dp))

        when {
            d.done -> {
                Text("Your account and everything saved with it has been deleted.", color = c.muted, fontSize = 14.sp)
                Spacer(Modifier.height(20.dp))
                Text(
                    "Continue", color = c.onAccent, fontSize = 14.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(c.accent)
                        .clickable { vm.signOut() }.padding(vertical = 14.dp),
                )
            }
            !AccountLogic.canDelete(tier) ->
                Text(AccountLogic.SUPER_NOT_ALLOWED, color = c.muted, fontSize = 14.sp)
            else -> {
                Text("This permanently deletes your account and everything saved with it. It can't be undone.", color = c.muted, fontSize = 14.sp)
                Spacer(Modifier.height(10.dp))
                listOf(
                    "Your progress, streaks and Anki history", "Your Writing entries",
                    "Your Word Bank and any words you added", "Your username and sign-in",
                ).forEach { Text("•  $it", color = c.muted, fontSize = 12.sp, modifier = Modifier.padding(start = 6.dp, bottom = 3.dp)) }
                Spacer(Modifier.height(16.dp))
                OutlinedTextField(
                    value = d.typed, onValueChange = { vm.deleteAccountTyped(it) }, singleLine = true, colors = fieldColors,
                    label = { Text("Type ${AccountLogic.DELETE_WORD} to confirm") }, modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = d.password, onValueChange = { vm.deleteAccountPassword(it) }, singleLine = true, colors = fieldColors,
                    label = { Text("Your password") }, visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password), modifier = Modifier.fillMaxWidth(),
                )
                d.error?.let {
                    Spacer(Modifier.height(10.dp))
                    Text(it, color = c.danger, fontSize = 13.sp)
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    if (d.busy) "Deleting…" else "Delete my account", color = c.onAccent, fontSize = 14.sp, fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                        .background(if (ready) c.danger else c.danger.copy(alpha = 0.4f))
                        .clickable(enabled = ready) { vm.deleteAccountConfirm() }.padding(vertical = 14.dp),
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    "Keep my account", color = c.muted, fontSize = 14.sp, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).border(BorderStroke(1.dp, c.border), RoundedCornerShape(12.dp))
                        .clickable { vm.home() }.padding(vertical = 14.dp),
                )
            }
        }
    }
}
