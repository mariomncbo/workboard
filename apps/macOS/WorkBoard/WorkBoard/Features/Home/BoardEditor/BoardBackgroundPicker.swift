import SwiftUI

/// "Fondo" of a board: the dot grid or one of the 10 palette colors.
struct BoardBackgroundPicker: View {
    @Binding var selection: BoardBackground

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Fondo")
                .font(.callout.weight(.medium))
                .foregroundStyle(Color.textSecondary)

            HStack(spacing: 2) {
                ForEach(BoardBackground.allCases, id: \.self) { background in
                    ColorSwatch(fill: fill(for: background), name: background.name, isSelected: selection == background) {
                        selection = background
                    }
                }
            }
            .padding(.horizontal, -4)
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Fondo")

            Text("\(Text(selection.name)). La cuadrícula de puntos usa el fondo animado de la app.")
                .font(.subheadline)
                .foregroundStyle(Color.textTertiary)
        }
    }

    private func fill(for background: BoardBackground) -> SwatchFill {
        switch background {
        case .dots: .dots
        case .color(let color): .color(color.color)
        }
    }
}
