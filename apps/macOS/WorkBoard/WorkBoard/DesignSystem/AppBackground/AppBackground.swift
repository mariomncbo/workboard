import SwiftUI

/// Animated dot grid that fills the window behind Login, Home and boards without color.
///
/// Use it through `.appBackground()`, which also tracks the pointer.
/// It stays still with Reduce Motion (the pointer effect still works without easing)
/// and pauses while the window is not active.
struct AppBackground: View {
    let pointer: PointerTracker
    var configuration = DotGridConfiguration.standard

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.appearsActive) private var appearsActive

    @State private var startDate = Date.now
    /// Origin of the canvas in global coordinates, to place the pointer.
    @State private var canvasOrigin = CGPoint.zero

    private var isPaused: Bool {
        reduceMotion || !appearsActive
    }

    private var renderer: DotGridRenderer {
        DotGridRenderer(
            configuration: configuration,
            backgroundColor: .bgPage,
            dotColor: .backdropDot,
            activeDotColor: .backdropDotActive
        )
    }

    var body: some View {
        TimelineView(.animation(minimumInterval: nil, paused: isPaused)) { timeline in
            Canvas { context, size in
                pointer.advance(to: timeline.date.timeIntervalSinceReferenceDate, animated: !isPaused)
                let pointerInCanvas = CGPoint(
                    x: pointer.position.x - canvasOrigin.x,
                    y: pointer.position.y - canvasOrigin.y
                )
                renderer.draw(
                    in: &context,
                    size: size,
                    time: reduceMotion ? 0 : timeline.date.timeIntervalSince(startDate),
                    pointer: pointerInCanvas,
                    pointerStrength: pointer.strength
                )
            }
        }
        .ignoresSafeArea()
        .onGeometryChange(for: CGPoint.self) { proxy in
            proxy.frame(in: .global).origin
        } action: { origin in
            canvasOrigin = origin
        }
        .accessibilityHidden(true)
    }
}

#Preview {
    Text("Mi espacio de trabajo")
        .font(.screenTitle)
        .foregroundStyle(Color.textPrimary)
        .frame(width: 900, height: 560)
        .appBackground()
}
