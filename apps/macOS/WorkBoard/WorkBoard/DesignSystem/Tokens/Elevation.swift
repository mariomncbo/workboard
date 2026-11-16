import SwiftUI

/// Shadows of the design system (`shadow-*` tokens).
/// Content (cards, lists, tasks) has no shadow: only menus, modals and dragged items float.
/// Glass gets its own shadow from the system.
enum Elevation {
    /// `shadow-menu`: context menus.
    case menu
    /// `shadow-lift`: a task or list while it is being dragged.
    case lift
    /// `shadow-modal`: modals and dialogs.
    case modal

    fileprivate var opacity: Double {
        switch self {
        case .menu, .lift: 0.55
        case .modal: 0.65
        }
    }

    /// SwiftUI radius ≈ half the CSS blur.
    fileprivate var radius: Double {
        switch self {
        case .menu: 16
        case .lift: 12
        case .modal: 32
        }
    }

    fileprivate var offsetY: Double {
        switch self {
        case .menu: 12
        case .lift: 10
        case .modal: 24
        }
    }
}

extension View {
    /// Applies one of the design system shadows.
    func elevation(_ level: Elevation) -> some View {
        shadow(color: .black.opacity(level.opacity), radius: level.radius, y: level.offsetY)
    }
}
