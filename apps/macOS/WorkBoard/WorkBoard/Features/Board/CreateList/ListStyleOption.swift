import SwiftUI

/// One style choice of "Crear lista", with a miniature of the list.
struct ListStyleOption: View {
    let style: BoardListStyle
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: Spacing.s2) {
                VStack(alignment: .leading, spacing: Spacing.s1) {
                    Capsule()
                        .fill(style.text)
                        .frame(width: 60, height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(style.field)
                        .frame(height: 12)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(style.field)
                        .frame(height: 12)
                }
                .padding(Spacing.s2)
                .frame(maxWidth: .infinity, minHeight: 64, alignment: .top)
                .background(style.background, in: .rect(cornerRadius: 8))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(style.border, lineWidth: 1)
                }
                .accessibilityHidden(true)

                Text(style.name)
                    .font(.control)
                    .foregroundStyle(Color.textPrimary)
            }
            .padding(10)
            .background(Color.bgComponentHover, in: .rect(cornerRadius: Radius.sm))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.sm)
                    .strokeBorder(isSelected ? Color.focusRing : Color.border, lineWidth: isSelected ? 2 : 1)
            }
            .contentShape(.rect(cornerRadius: Radius.sm))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}
