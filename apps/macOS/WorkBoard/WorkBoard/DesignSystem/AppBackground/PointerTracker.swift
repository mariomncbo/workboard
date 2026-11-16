import SwiftUI

/// Follows the pointer for the animated background and smooths its movement,
/// so the effect glides after the cursor and fades in and out softly.
@Observable
final class PointerTracker {
    /// Latest pointer position, in global coordinates.
    private(set) var target = CGPoint.zero
    /// Whether the pointer is over the window content.
    private(set) var isInside = false

    // Smoothed values, advanced once per rendered frame. They are not observed:
    // the animation timeline already redraws every frame.
    @ObservationIgnored private(set) var position = CGPoint.zero
    @ObservationIgnored private(set) var strength = 0.0
    @ObservationIgnored private var lastFrameTime: TimeInterval?

    /// Per-frame easing at 60 fps, as in the design reference.
    private let positionEasing = 0.15
    private let strengthEasing = 0.08

    func handle(_ phase: HoverPhase) {
        switch phase {
        case .active(let location):
            // Start where the pointer enters instead of sliding in from far away.
            if strength < 0.01 {
                position = location
            }
            target = location
            isInside = true
        case .ended:
            isInside = false
        }
    }

    /// Moves the smoothed values towards the pointer.
    /// - Parameters:
    ///   - time: Time of the frame being drawn.
    ///   - animated: When false (Reduce Motion, paused window), values jump to the target.
    func advance(to time: TimeInterval, animated: Bool) {
        let targetStrength = isInside ? 1.0 : 0.0
        defer { lastFrameTime = time }

        guard animated, let lastFrameTime else {
            position = target
            strength = targetStrength
            return
        }

        // Frame-rate independent version of "value += (target - value) * easing" per 60 fps frame.
        let frames = min(max((time - lastFrameTime) * 60, 0), 10)
        let positionStep = 1 - pow(1 - positionEasing, frames)
        let strengthStep = 1 - pow(1 - strengthEasing, frames)

        position.x += (target.x - position.x) * positionStep
        position.y += (target.y - position.y) * positionStep
        strength += (targetStrength - strength) * strengthStep
    }
}
