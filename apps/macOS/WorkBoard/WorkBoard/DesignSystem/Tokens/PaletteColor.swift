import SwiftUI

/// The 10 user colors for boards and tasks (`palette-*` tokens).
///
/// Raw values match the `palette_color` enum in the database. All colors share
/// the same lightness, so text on top is always `Color.onPalette`.
nonisolated enum PaletteColor: String, CaseIterable, Identifiable, Codable, Sendable {
    case blue, teal, green, lime, amber, orange, red, pink, violet, graphite

    var id: Self { self }

    /// Name shown in the interface.
    var name: LocalizedStringResource {
        switch self {
        case .blue: "Azul"
        case .teal: "Turquesa"
        case .green: "Verde"
        case .lime: "Lima"
        case .amber: "Ámbar"
        case .orange: "Naranja"
        case .red: "Rojo"
        case .pink: "Rosa"
        case .violet: "Violeta"
        case .graphite: "Grafito"
        }
    }

    var color: Color {
        switch self {
        case .blue: Color(hex: 0x3B6692)
        case .teal: Color(hex: 0x007176)
        case .green: Color(hex: 0x3D7149)
        case .lime: Color(hex: 0x586C33)
        case .amber: Color(hex: 0x7D5D23)
        case .orange: Color(hex: 0x8A5435)
        case .red: Color(hex: 0x8D4F4A)
        case .pink: Color(hex: 0x874E6A)
        case .violet: Color(hex: 0x67598F)
        case .graphite: Color(hex: 0x60636A)
        }
    }
}
