import SwiftUI

/// A button inside the floating bar. It has no glass of its own: the bar is one glass
/// capsule, and the button only lights up under the pointer.
struct FloatingBarButton: View {
    let title: LocalizedStringKey
    let systemImage: String
    var isActive = false
    let action: () -> Void

    @Environment(\.isEnabled) private var isEnabled
    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .labelStyle(.titleAndIcon)
                .font(.control)
                .foregroundStyle(isActive ? Color.accentText : Color.textPrimary)
                .padding(.horizontal, Spacing.s3)
                .frame(height: ControlMetrics.glassHeight)
                .background(background, in: .capsule)
                .contentShape(.capsule)
                .opacity(isEnabled ? 1 : 0.5)
        }
        .buttonStyle(.plain)
        .onHover { isHovered = $0 }
        .accessibilityAddTraits(isActive ? .isSelected : [])
    }

    private var background: Color {
        if isActive {
            return Color.accentSolid.opacity(0.22)
        }
        return isHovered && isEnabled ? Color.white.opacity(0.1) : .clear
    }
}
