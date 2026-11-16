import SwiftUI

/// Appearance of a `ContentButtonStyle` button, with hover, pressed and disabled states.
struct ContentButtonBody: View {
    let configuration: ButtonStyleConfiguration
    let kind: ContentButtonStyle.Kind

    @Environment(\.isEnabled) private var isEnabled
    @State private var isHovered = false

    var body: some View {
        configuration.label
            .font(.control)
            .lineLimit(1)
            .foregroundStyle(foreground)
            .padding(.horizontal, 10)
            .frame(minHeight: ControlMetrics.contentHeight)
            .background(background, in: .rect(cornerRadius: Radius.xs))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.xs)
                    .strokeBorder(borderColor, lineWidth: 1)
            }
            .brightness(brightness)
            .opacity(isEnabled ? 1 : 0.45)
            .contentShape(.rect(cornerRadius: Radius.xs))
            .onHover { isHovered = $0 }
            .animation(.easeOut(duration: 0.15), value: isHovered)
    }

    private var isHighlighted: Bool {
        isHovered && isEnabled
    }

    private var foreground: Color {
        switch kind {
        case .primary: .onAccent
        case .secondary: .textPrimary
        case .plain: isHighlighted ? .textPrimary : .textSecondary
        case .danger: .onDanger
        }
    }

    private var background: Color {
        switch kind {
        case .primary: .accentSolid
        case .secondary: .bgComponentHover
        case .plain: isHighlighted ? .bgComponentHover : .clear
        case .danger: .dangerSolid
        }
    }

    private var borderColor: Color {
        switch kind {
        case .secondary: isHighlighted ? .borderHover : .border
        case .primary, .plain, .danger: .clear
        }
    }

    /// Filled buttons darken a little on hover, and a little more while pressed.
    private var brightness: Double {
        if configuration.isPressed {
            return -0.08
        }
        switch kind {
        case .primary, .danger: return isHighlighted ? -0.05 : 0
        case .secondary, .plain: return 0
        }
    }
}
