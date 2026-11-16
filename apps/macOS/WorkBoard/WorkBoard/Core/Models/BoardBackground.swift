import Foundation

/// Background of a board: the animated dot grid or one of the palette colors.
/// Stored in `boards.background` as `"dots"` or the color's raw value.
nonisolated enum BoardBackground: Hashable, Sendable, Codable {
    case dots
    case color(PaletteColor)

    private static let dotsValue = "dots"

    /// Every option, in the order of the picker: dots first, then the palette.
    static let allCases: [BoardBackground] = [.dots] + PaletteColor.allCases.map { .color($0) }

    var name: LocalizedStringResource {
        switch self {
        case .dots: "Cuadrícula de puntos"
        case .color(let color): color.name
        }
    }

    init(from decoder: any Decoder) throws {
        let value = try decoder.singleValueContainer().decode(String.self)
        if value == Self.dotsValue {
            self = .dots
        } else if let color = PaletteColor(rawValue: value) {
            self = .color(color)
        } else {
            // Unknown values from a newer app version fall back to the default.
            self = .dots
        }
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .dots: try container.encode(Self.dotsValue)
        case .color(let color): try container.encode(color.rawValue)
        }
    }
}
