import SwiftUI

/// Places the animated dot grid behind the content and feeds it the pointer position.
/// The pointer is tracked on the content itself, so the effect also follows the
/// cursor over cards and controls.
struct AppBackgroundModifier: ViewModifier {
    @State private var pointer = PointerTracker()

    func body(content: Content) -> some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background {
                AppBackground(pointer: pointer)
            }
            .onContinuousHover(coordinateSpace: .global) { phase in
                pointer.handle(phase)
            }
    }
}

extension View {
    /// Fills the window behind this view with the animated dot grid.
    func appBackground() -> some View {
        modifier(AppBackgroundModifier())
    }
}
