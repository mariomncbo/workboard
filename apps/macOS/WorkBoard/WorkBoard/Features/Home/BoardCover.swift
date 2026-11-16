import SwiftUI

/// Top strip of a board card: the board color, or the dot grid.
struct BoardCover: View {
    let background: BoardBackground

    var body: some View {
        switch background {
        case .dots:
            DotPattern()
        case .color(let color):
            color.color
        }
    }
}
