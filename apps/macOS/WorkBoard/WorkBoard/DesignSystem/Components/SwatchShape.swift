import SwiftUI

/// The rounded square inside a `ColorSwatch`.
struct SwatchShape: View {
    let fill: SwatchFill

    var body: some View {
        switch fill {
        case .color(let color):
            RoundedRectangle(cornerRadius: Radius.xs)
                .fill(color)
        case .none:
            RoundedRectangle(cornerRadius: Radius.xs)
                .fill(Color.bgComponentActive)
                .strokeBorder(Color.borderHover, lineWidth: 1)
                .overlay {
                    Image(systemName: "line.diagonal")
                        .font(.caption)
                        .foregroundStyle(Color.textTertiary)
                }
        case .dots:
            DotPattern(spacing: 6, dotRadius: 0.75)
                .clipShape(.rect(cornerRadius: Radius.xs))
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.xs)
                        .strokeBorder(Color.borderHover, lineWidth: 1)
                }
        }
    }
}
