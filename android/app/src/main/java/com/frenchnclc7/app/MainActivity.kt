package com.frenchnclc7.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.frenchnclc7.app.ui.AnkiScreen
import com.frenchnclc7.app.ui.AuthScreen
import com.frenchnclc7.app.ui.DayScreen
import com.frenchnclc7.app.ui.HomeScreen
import com.frenchnclc7.app.ui.LocalColors
import com.frenchnclc7.app.ui.StudyScreen
import com.frenchnclc7.app.ui.WritingScreen
import com.frenchnclc7.app.ui.Themes

class MainActivity : ComponentActivity() {
    private val vm: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val state by vm.state.collectAsStateWithLifecycle()
            val colors = Themes.get(state.themeId)
            CompositionLocalProvider(LocalColors provides colors) {
                Box(Modifier.fillMaxSize().background(colors.bg).statusBarsPadding()) {
                    when (val screen = state.screen) {
                        Screen.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = colors.accent)
                        }
                        Screen.Auth -> AuthScreen(state, vm)
                        Screen.Home -> HomeScreen(state, vm)
                        Screen.Study -> state.study?.let { StudyScreen(it, state.tier, vm) }
                        Screen.Writing -> state.writing?.let { WritingScreen(it, vm) }
                        Screen.Anki -> state.anki?.let { AnkiScreen(it, vm) }
                        is Screen.Day -> {
                            BackHandler { vm.home() }
                            DayScreen(screen, state.tier, state.dayPlan, vm)
                        }
                    }
                }
            }
        }
    }
}
