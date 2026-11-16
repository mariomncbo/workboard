/// Tunable values of the animated dot grid, in points unless stated otherwise.
/// The standard values come from the design system (AppBackground component).
nonisolated struct DotGridConfiguration: Sendable {
    /// Distance between dots.
    var spacing = 20.0
    /// Dot radius at rest.
    var dotRadius = 1.0
    /// Radius around the pointer where dots react.
    var cursorRadius = 140.0
    /// Extra radius of a dot right under the pointer.
    var growth = 1.4
    /// How far dots move away from the pointer (magnifier effect).
    var push = 11.0
    /// How much dots near the pointer are tinted towards the accent (0–1).
    var tint = 0.75
    /// Strength of the slow diagonal brightness wave (0–1).
    var waveAmount = 0.25
    /// Speed of the wave.
    var waveSpeed = 0.5

    static let standard = DotGridConfiguration()
}
