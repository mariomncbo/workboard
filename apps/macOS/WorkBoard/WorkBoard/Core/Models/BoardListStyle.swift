import Foundation

/// Look of a list: white or black. Raw values match the `list_style` enum in the database.
nonisolated enum BoardListStyle: String, CaseIterable, Codable, Identifiable, Sendable {
    case light
    case dark

    var id: Self { self }

    var name: LocalizedStringResource {
        switch self {
        case .light: "Blanco"
        case .dark: "Negro"
        }
    }
}
