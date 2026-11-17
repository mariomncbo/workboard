import SwiftUI

/// Background of an open board: its color, or the animated dot grid.
struct BoardBackdrop: View {
    let background: BoardBackground
    let pointer: PointerTracker

    var body: some View {
        switch background {
        case .dots:
            AppBackground(pointer: pointer)
        case .color(let color):
            color.color
                .ignoresSafeArea()
        }
    }
}
