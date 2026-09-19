package com.frenchnclc7.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.frenchnclc7.app.AppViewModel
import com.frenchnclc7.app.UiState

@Composable
fun AuthScreen(state: UiState, vm: AppViewModel) {
    val c = LocalColors.current
    var creating by rememberSaveable { mutableStateOf(false) }
    var useUsername by rememberSaveable { mutableStateOf(false) }
    var who by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var username by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedTextColor = c.text, unfocusedTextColor = c.text,
        focusedBorderColor = c.accent, unfocusedBorderColor = c.border,
        focusedLabelColor = c.accent, unfocusedLabelColor = c.muted, cursorColor = c.accent,
    )

    Column(
        Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).imePadding().padding(horizontal = 24.dp, vertical = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("A DAILY LANGUAGE JOURNEY", color = c.gold, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
        Spacer(Modifier.height(10.dp))
        Text("French NCLC 7", color = c.text, fontSize = 30.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
        Text("Preparation Plan", color = c.text, fontSize = 30.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
        Spacer(Modifier.height(28.dp))
        Text(if (creating) "Create your account" else "Sign in", color = c.text, fontSize = 18.sp, fontWeight = FontWeight.Medium)
        Spacer(Modifier.height(16.dp))

        if (!creating) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(selected = !useUsername, onClick = { useUsername = false; who = "" }, colors = RadioButtonDefaults.colors(selectedColor = c.accent, unselectedColor = c.muted))
                Text("Email", color = c.text, modifier = Modifier.clickable { useUsername = false; who = "" })
                Spacer(Modifier.padding(horizontal = 10.dp))
                RadioButton(selected = useUsername, onClick = { useUsername = true; who = "" }, colors = RadioButtonDefaults.colors(selectedColor = c.accent, unselectedColor = c.muted))
                Text("Username", color = c.text, modifier = Modifier.clickable { useUsername = true; who = "" })
            }
            OutlinedTextField(
                value = who, onValueChange = { who = it }, singleLine = true, colors = fieldColors,
                label = { Text(if (useUsername) "Username" else "Email") },
                keyboardOptions = KeyboardOptions(keyboardType = if (useUsername) KeyboardType.Text else KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
            )
        } else {
            OutlinedTextField(
                value = email, onValueChange = { email = it }, singleLine = true, colors = fieldColors, label = { Text("Email") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(
                value = username, onValueChange = { username = it }, singleLine = true, colors = fieldColors,
                label = { Text("Username (3-20 letters, numbers, _)") }, modifier = Modifier.fillMaxWidth(),
            )
        }
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = password, onValueChange = { password = it }, singleLine = true, colors = fieldColors, label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password), modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(14.dp))

        state.authError?.let { Text(it, color = c.danger, fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(bottom = 10.dp)) }
        state.authNotice?.let { Text(it, color = c.success, fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(bottom = 10.dp)) }

        Button(
            onClick = { if (creating) vm.signUp(email, username, password) else vm.signIn(useUsername, who, password) },
            enabled = !state.authBusy,
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = c.accent, contentColor = c.onAccent),
            modifier = Modifier.fillMaxWidth().height(48.dp),
        ) {
            Text(if (state.authBusy) "Please wait…" else if (creating) "Create account" else "Sign in", fontWeight = FontWeight.Medium)
        }
        Spacer(Modifier.height(14.dp))
        Text(
            if (creating) "Already have an account? Sign in" else "New here? Create an account",
            color = c.link, fontSize = 13.sp,
            modifier = Modifier.clickable { creating = !creating; vm.clearAuthMessages() }.padding(8.dp),
        )
    }
}
