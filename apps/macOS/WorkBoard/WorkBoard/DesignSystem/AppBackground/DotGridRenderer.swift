import SwiftUI

/// Draws one frame of the dot grid.
///
/// Same algorithm as the design reference: a slow diagonal wave changes dot size and
/// brightness, and dots near the pointer grow, move away and take the accent color.
/// Dots outside the pointer radius are grouped by wave level and filled in a few
/// paths; only the dots near the pointer are drawn one by one.
nonisolated struct DotGridRenderer {
    let configuration: DotGridConfiguration
    let backgroundColor: Color
    let dotColor: Color
    let activeDotColor: Color

    /// Number of wave levels used to group resting dots.
    private static let waveLevels = 12

    func draw(
        in context: inout GraphicsContext,
        size: CGSize,
        time: Double,
        pointer: CGPoint,
        pointerStrength: Double
    ) {
        context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(backgroundColor))

        let config = configuration
        let lastLevel = Double(Self.waveLevels - 1)
        var restingDots = Array(repeating: Path(), count: Self.waveLevels)

        let width = Double(size.width)
        let height = Double(size.height)
        let pointerX = Double(pointer.x)
        let pointerY = Double(pointer.y)

        var y: Double = config.spacing / 2
        while y < height + config.spacing {
            var x: Double = config.spacing / 2
            while x < width + config.spacing {
                let phase: Double = (x * 0.8 + y) * 0.010 - time * config.waveSpeed
                let wave: Double = 0.5 + 0.5 * sin(phase)
                let dx: Double = x - pointerX
                let dy: Double = y - pointerY
                let distance: Double = max((dx * dx + dy * dy).squareRoot(), 1)

                // Smoothstep falloff from the pointer.
                let linear: Double = pointerStrength * max(0, 1 - distance / config.cursorRadius)
                let near: Double = linear * linear * (3 - 2 * linear)

                if near > 0.001 {
                    let offset: Double = config.push * near / distance
                    let center = CGPoint(x: x + dx * offset, y: y + dy * offset)
                    let restingRadius: Double = config.dotRadius * (1 + config.waveAmount * wave)
                    let radius: Double = restingRadius + config.growth * near
                    let tint: Double = min(1, near * 1.1) * config.tint
                    let glow: Double = max(wave * config.waveAmount * 2.4, near)
                    let opacity: Double = min(1, 0.7 + 0.3 * glow)
                    context.fill(
                        Path(ellipseIn: dotRect(center: center, radius: radius)),
                        with: .color(dotColor.mix(with: activeDotColor, by: tint).opacity(opacity))
                    )
                } else {
                    let level = Int((wave * lastLevel).rounded())
                    let levelWave = Double(level) / lastLevel
                    let radius = config.dotRadius * (1 + config.waveAmount * levelWave)
                    restingDots[level].addEllipse(in: dotRect(center: CGPoint(x: x, y: y), radius: radius))
                }
                x += config.spacing
            }
            y += config.spacing
        }

        for (level, path) in restingDots.enumerated() where !path.isEmpty {
            let levelWave = Double(level) / lastLevel
            let opacity = min(1, 0.7 + 0.3 * levelWave * config.waveAmount * 2.4)
            context.fill(path, with: .color(dotColor.opacity(opacity)))
        }
    }

    private func dotRect(center: CGPoint, radius: Double) -> CGRect {
        CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2)
    }
}
