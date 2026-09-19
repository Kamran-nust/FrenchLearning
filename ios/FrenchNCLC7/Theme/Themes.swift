import SwiftUI

/// The same colour tokens as the web app's themes (frontend/src/shared/themes.js).
struct AppColors {
    let label: String
    let bg: Color, card: Color, border: Color
    let accent: Color, accentSoft: Color, onAccent: Color
    let hard: Color, gold: Color
    let text: Color, muted: Color, success: Color, link: Color, danger: Color
}

private func hex(_ value: UInt32) -> Color {
    Color(
        red: Double((value >> 16) & 0xFF) / 255,
        green: Double((value >> 8) & 0xFF) / 255,
        blue: Double(value & 0xFF) / 255
    )
}

private func rgba(_ r: Double, _ g: Double, _ b: Double, _ a: Double) -> Color {
    Color(red: r / 255, green: g / 255, blue: b / 255, opacity: a)
}

enum Themes {
    static let defaultId = "midnight"

    /// In display order.
    static let order = ["midnight", "paper", "lavender", "blush"]

    static let all: [String: AppColors] = [
        "midnight": AppColors(
            label: "Midnight", bg: hex(0x0B1220), card: hex(0x131C2E), border: hex(0x25314A),
            accent: hex(0x3B82F6), accentSoft: rgba(59, 130, 246, 0.14), onAccent: hex(0x0B1220),
            hard: hex(0xF59E0B), gold: hex(0xF5B841),
            text: hex(0xE8EDF6), muted: hex(0x8291AB), success: hex(0x22C55E), link: hex(0x93C5FD), danger: hex(0xF87171)
        ),
        "paper": AppColors(
            label: "Paper", bg: hex(0xF6F7F9), card: hex(0xFFFFFF), border: hex(0xE2E6EE),
            accent: hex(0x2563EB), accentSoft: rgba(37, 99, 235, 0.10), onAccent: hex(0xFFFFFF),
            hard: hex(0xD97706), gold: hex(0x7F5600),
            text: hex(0x1B2233), muted: hex(0x5B667A), success: hex(0x15803D), link: hex(0x1D4ED8), danger: hex(0xB91C1C)
        ),
        "lavender": AppColors(
            label: "Lavender", bg: hex(0xF3EFFB), card: hex(0xFFFFFF), border: hex(0xDDD3F0),
            accent: hex(0x7255D6), accentSoft: rgba(114, 85, 214, 0.11), onAccent: hex(0xFFFFFF),
            hard: hex(0xD97706), gold: hex(0x7F5600),
            text: hex(0x2A1F4D), muted: hex(0x665B8A), success: hex(0x15803D), link: hex(0x5A3FC0), danger: hex(0xB91C1C)
        ),
        "blush": AppColors(
            label: "Blush", bg: hex(0xFDF1F5), card: hex(0xFFFFFF), border: hex(0xF3D3DD),
            accent: hex(0xC43570), accentSoft: rgba(196, 53, 112, 0.10), onAccent: hex(0xFFFFFF),
            hard: hex(0xD97706), gold: hex(0x7F5600),
            text: hex(0x4A1F2E), muted: hex(0x86566A), success: hex(0x15803D), link: hex(0xA82860), danger: hex(0xB91C1C)
        ),
    ]

    static func get(_ id: String?) -> AppColors {
        all[id ?? defaultId] ?? all[defaultId]!
    }
}
