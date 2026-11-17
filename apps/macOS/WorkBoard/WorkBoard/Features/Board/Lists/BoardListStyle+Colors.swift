import SwiftUI

/// Colors of each list style (`list-light-*` and `list-dark-*` tokens).
extension BoardListStyle {
    var background: Color {
        switch self {
        case .light: .listLight
        case .dark: .listDark
        }
    }

    var text: Color {
        switch self {
        case .light: .listLightText
        case .dark: .listDarkText
        }
    }

    /// Task count, "⋯" and "Añade una tarea".
    var secondaryText: Color {
        switch self {
        case .light: .listLightTextSecondary
        case .dark: .listDarkTextSecondary
        }
    }

    /// Uncolored tasks and the add-task field.
    var field: Color {
        switch self {
        case .light: .listLightField
        case .dark: .listDarkField
        }
    }

    /// The black list needs a border to stand out from dark backgrounds.
    var border: Color {
        switch self {
        case .light: .clear
        case .dark: .border
        }
    }
}
