import SwiftUI

/// Still dot grid on the page background: the small version of the animated background,
/// for swatches and board covers.
struct DotPattern: View {
    var spacing = 10.0
    var dotRadius = 1.0

    var body: some View {
        Canvas { context, size in
            context.fill(Path(CGRect(origin: .zero, size: size)), with: .color(.bgPage))
            var dots = Path()
            var y = spacing / 2
            while y < size.height {
                var x = spacing / 2
                while x < size.width {
                    dots.addEllipse(in: CGRect(x: x - dotRadius, y: y - dotRadius, width: dotRadius * 2, height: dotRadius * 2))
                    x += spacing
                }
                y += spacing
            }
            context.fill(dots, with: .color(.backdropDot))
        }
        .accessibilityHidden(true)
    }
}
