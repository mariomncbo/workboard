import SwiftUI

/// What a `ColorSwatch` shows.
enum SwatchFill {
    case color(Color)
    /// "Sin color": empty square with a diagonal line.
    case none
    /// Board background with the dot grid.
    case dots
}
