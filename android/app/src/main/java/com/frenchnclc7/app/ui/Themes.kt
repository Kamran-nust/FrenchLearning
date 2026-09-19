package com.frenchnclc7.app.ui

import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color

/** The same colour tokens as the web app's themes (frontend/src/shared/themes.js). */
data class AppColors(
    val label: String,
    val bg: Color, val card: Color, val border: Color,
    val accent: Color, val accentSoft: Color, val onAccent: Color,
    val hard: Color, val gold: Color, val frBlue: Color, val frRed: Color,
    val text: Color, val muted: Color, val success: Color, val link: Color,
    val danger: Color, val warnText: Color, val warnSoft: Color,
)

private fun hex(v: Long) = Color(0xFF000000 or v)
private fun rgba(r: Int, g: Int, b: Int, a: Float) = Color(r / 255f, g / 255f, b / 255f, a)

object Themes {
    val all: Map<String, AppColors> = linkedMapOf(
        "midnight" to AppColors(
            "Midnight", hex(0x0B1220), hex(0x131C2E), hex(0x25314A),
            hex(0x3B82F6), rgba(59, 130, 246, 0.14f), hex(0x0B1220),
            hex(0xF59E0B), hex(0xF5B841), hex(0x2E4A9E), hex(0xB23A48),
            hex(0xE8EDF6), hex(0x8291AB), hex(0x22C55E), hex(0x93C5FD),
            hex(0xF87171), hex(0xF5C77E), rgba(245, 158, 11, 0.14f),
        ),
        "paper" to AppColors(
            "Paper", hex(0xF6F7F9), hex(0xFFFFFF), hex(0xE2E6EE),
            hex(0x2563EB), rgba(37, 99, 235, 0.10f), hex(0xFFFFFF),
            hex(0xD97706), hex(0x7F5600), hex(0x2E4A9E), hex(0xB23A48),
            hex(0x1B2233), hex(0x5B667A), hex(0x15803D), hex(0x1D4ED8),
            hex(0xB91C1C), hex(0x92400E), rgba(217, 119, 6, 0.12f),
        ),
        "lavender" to AppColors(
            "Lavender", hex(0xF3EFFB), hex(0xFFFFFF), hex(0xDDD3F0),
            hex(0x7255D6), rgba(114, 85, 214, 0.11f), hex(0xFFFFFF),
            hex(0xD97706), hex(0x7F5600), hex(0x4B3FA6), hex(0xB23A48),
            hex(0x2A1F4D), hex(0x665B8A), hex(0x15803D), hex(0x5A3FC0),
            hex(0xB91C1C), hex(0x92400E), rgba(217, 119, 6, 0.12f),
        ),
        "blush" to AppColors(
            "Blush", hex(0xFDF1F5), hex(0xFFFFFF), hex(0xF3D3DD),
            hex(0xC43570), rgba(196, 53, 112, 0.10f), hex(0xFFFFFF),
            hex(0xD97706), hex(0x7F5600), hex(0x2E4A9E), hex(0xB23A48),
            hex(0x4A1F2E), hex(0x86566A), hex(0x15803D), hex(0xA82860),
            hex(0xB91C1C), hex(0x92400E), rgba(217, 119, 6, 0.12f),
        ),
    )

    const val DEFAULT = "midnight"
    fun get(id: String?): AppColors = all[id] ?: all.getValue(DEFAULT)
}

val LocalColors = compositionLocalOf { Themes.get(Themes.DEFAULT) }
