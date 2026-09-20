package com.frenchnclc7.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.CircularProgressIndicator
import android.app.Activity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.frenchnclc7.app.ui.AdminScreen
import com.frenchnclc7.app.ui.PlansScreen
import com.frenchnclc7.app.ui.WordBankScreen
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
            // Dark icons on the light themes, light icons on Midnight, so the clock and battery are always readable.
            val view = LocalView.current
            val lightTheme = colors.bg.luminance() > 0.5f
            SideEffect {
                val window = (view.context as Activity).window
                val controller = WindowCompat.getInsetsController(window, view)
                controller.isAppearanceLightStatusBars = lightTheme
                controller.isAppearanceLightNavigationBars = lightTheme
            }
            CompositionLocalProvider(LocalColors provides colors) {
                // One handler for the whole app, so a screen's Back cannot also trigger the next screen's Back.
                BackHandler(enabled = state.screen !in listOf(Screen.Loading, Screen.Auth, Screen.Home)) { vm.systemBack() }
                Box(Modifier.fillMaxSize().background(colors.bg).statusBarsPadding().navigationBarsPadding()) {
                    when (val screen = state.screen) {
                        Screen.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = colors.accent)
                        }
                        Screen.Auth -> AuthScreen(state, vm)
                        Screen.Home -> HomeScreen(state, vm)
                        Screen.Study -> state.study?.let { StudyScreen(it, state.tier, vm) }
                        Screen.Writing -> state.writing?.let { WritingScreen(it, vm) }
                        Screen.Anki -> state.anki?.let { AnkiScreen(it, state.tier, vm) }
                        Screen.Admin -> state.admin?.let { AdminScreen(it, state.session?.userId, vm) }
                        Screen.Plans -> PlansScreen(state.plans, state.tier, vm)
                        Screen.WordBank -> state.wordBank?.let { WordBankScreen(it, state.tier, vm) }
                        is Screen.Day -> DayScreen(screen, state.tier, state.dayPlan, vm)
                    }
                }
            }
        }
    }
}
