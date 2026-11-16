import SwiftUI

/// One selectable color square of `PaletteColorPicker`. A `nil` fill is the "no color" option.
struct ColorSwatch: View {
    let fill: Color?
    let name: LocalizedStringResource
    let isSelected: Bool
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            RoundedRectangle(cornerRadius: Radius.xs)
                .fill(fill ?? .bgComponentActive)
                .overlay {
                    if fill == nil {
                        RoundedRectangle(cornerRadius: Radius.xs)
                            .strokeBorder(Color.borderHover, lineWidth: 1)
                        Image(systemName: "line.diagonal")
                            .font(.caption)
                            .foregroundStyle(Color.textTertiary)
                    }
                }
                .frame(width: 24, height: 24)
                .padding(4)
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.xs + 3)
                        .strokeBorder(isSelected ? Color.focusRing : Color.borderHover, lineWidth: 2)
                        .opacity(isSelected ? 1 : (isHovered ? 0.6 : 0))
                }
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .onHover { isHovered = $0 }
        .help(Text(name))
        .accessibilityLabel(Text(name))
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}
