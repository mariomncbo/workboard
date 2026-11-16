import SwiftUI

/// The WorkBoard symbol: a rounded white square with three dark lists that form a W.
/// Geometry taken 1:1 from `brand/logo/workboard-simbolo-oscuro.svg` (100 × 100 grid).
struct LogoSymbol: View {
    private static let squareColor = Color(hex: 0xEEF0F4)
    private static let listColor = Color(hex: 0x17181B)

    /// Lists as (x, height) on the 100-unit grid; all start at y = 14 and are 20 wide.
    private static let lists: [(x: Double, height: Double)] = [(14, 72), (40, 46), (66, 72)]

    var body: some View {
        Canvas { context, size in
            let scale = min(size.width, size.height) / 100

            let square = CGRect(x: 0, y: 0, width: 100 * scale, height: 100 * scale)
            context.fill(Path(roundedRect: square, cornerRadius: 22 * scale), with: .color(Self.squareColor))

            for list in Self.lists {
                let rect = CGRect(x: list.x * scale, y: 14 * scale, width: 20 * scale, height: list.height * scale)
                context.fill(Path(roundedRect: rect, cornerRadius: 6 * scale), with: .color(Self.listColor))
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .accessibilityHidden(true)
    }
}

#Preview {
    LogoSymbol()
        .frame(width: 64, height: 64)
        .padding()
        .background(Color.bgPage)
}
