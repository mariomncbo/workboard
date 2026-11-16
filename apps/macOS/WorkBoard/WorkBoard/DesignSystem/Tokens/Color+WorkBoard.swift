import SwiftUI

// Color tokens of the WorkBoard design system (tokens.json), dark theme only.
// Components use the semantic tokens below, never the primitive ramps.

// MARK: - Primitives (private to this file)

private extension Color {
    static let neutral1 = Color(hex: 0x0A0B0D)
    static let neutral2 = Color(hex: 0x101214)
    static let neutral3 = Color(hex: 0x17181B)
    static let neutral4 = Color(hex: 0x1E1F22)
    static let neutral5 = Color(hex: 0x242528)
    static let neutral6 = Color(hex: 0x2B2D2F)
    static let neutral7 = Color(hex: 0x38393C)
    static let neutral8 = Color(hex: 0x4E5053)
    static let neutral10 = Color(hex: 0x8B8C8F)
    static let neutral11 = Color(hex: 0xB3B4B7)
    static let neutral12 = Color(hex: 0xEEF0F4)

    static let accent5 = Color(hex: 0x173863)
    static let accent11 = Color(hex: 0x92C1FF)

    static let red3 = Color(hex: 0x3A1412)
    static let red9 = Color(hex: 0xC43F3E)
    static let red11 = Color(hex: 0xF8A49D)
}

// MARK: - Semantic tokens

extension Color {
    // Surfaces
    /// Window background, under the dot grid.
    static let bgPage = neutral1
    /// Notes and Planner side panels.
    static let bgSubtle = neutral2
    /// Board cards, modals and menus.
    static let bgComponent = neutral3
    /// Component or menu row under the pointer.
    static let bgComponentHover = neutral4
    /// Pressed or selected component; text fields.
    static let bgComponentActive = neutral5

    // Borders
    /// Separators and resting card borders.
    static let borderSubtle = neutral6
    /// Control borders and the dark list.
    static let border = neutral7
    /// Card and control borders under the pointer.
    static let borderHover = neutral8

    // Text
    static let textPrimary = neutral12
    /// Metadata, nickname, task count.
    static let textSecondary = neutral11
    /// Placeholders and help text.
    static let textTertiary = neutral10

    // Accent
    /// Fill of the single primary action of a view. Follows the system accent color.
    static let accentSolid = Color.accentColor
    static let onAccent = Color.white
    /// Background of a selected element.
    static let accentSubtle = accent5
    /// Links, active element and selection text.
    static let accentText = accent11
    /// 2 pt focus ring with a 2 pt gap.
    static let focusRing = accent11

    // Danger (permanent deletions only)
    /// Confirm button of a permanent deletion.
    static let dangerSolid = red9
    static let onDanger = Color.white
    /// "Eliminar…" items in menus.
    static let dangerText = red11
    /// Background of the trash icon in the deletion dialog.
    static let dangerSubtle = red3

    /// Filled star of a favorite board.
    static let favorite = Color(hex: 0xE4B750)

    // Animated background
    static let backdropDot = neutral6
    static let backdropDotActive = accent11

    // Lists: white style
    static let listLight = neutral12
    static let listLightText = neutral1
    static let listLightTextSecondary = Color(hex: 0x545558)
    /// Uncolored tasks and the "Añade una tarea" field in a white list.
    static let listLightField = Color(hex: 0xE1E3E6)

    // Lists: black style
    static let listDark = neutral2
    static let listDarkText = neutral12
    static let listDarkTextSecondary = neutral11
    /// Uncolored tasks and the "Añade una tarea" field in a black list.
    static let listDarkField = neutral4

    /// Text on any palette color (≥ 5.7:1).
    static let onPalette = Color.white
}
