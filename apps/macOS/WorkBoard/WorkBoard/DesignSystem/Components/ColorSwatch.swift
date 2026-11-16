import SwiftUI

/// One selectable square of a color or background picker.
struct ColorSwatch: View {
    let fill: SwatchFill
    let name: LocalizedStringResource
    let isSelected: Bool
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            SwatchShape(fill: fill)
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
