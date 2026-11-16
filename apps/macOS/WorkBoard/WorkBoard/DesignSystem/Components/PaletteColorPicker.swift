import SwiftUI

/// Picker for the 10 palette colors, optionally with "Sin color" first.
/// Used by the task modal; the selected color's name is shown underneath.
struct PaletteColorPicker: View {
    @Binding var selection: PaletteColor?
    var allowsNoColor = true

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s1) {
            HStack(spacing: 2) {
                if allowsNoColor {
                    ColorSwatch(fill: nil, name: "Sin color", isSelected: selection == nil) {
                        selection = nil
                    }
                }
                ForEach(PaletteColor.allCases) { color in
                    ColorSwatch(fill: color.color, name: color.name, isSelected: selection == color) {
                        selection = color
                    }
                }
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Color")

            Text(selection?.name ?? "Sin color")
                .font(.subheadline)
                .foregroundStyle(Color.textTertiary)
                .padding(.leading, 4)
        }
    }
}

#Preview {
    @Previewable @State var selection: PaletteColor? = .amber

    PaletteColorPicker(selection: $selection)
        .padding(Spacing.s5)
        .background(Color.bgComponent)
}
