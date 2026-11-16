import SwiftUI

/// Appearance of a `TextLinkButtonStyle` button.
struct TextLinkButtonBody: View {
    let configuration: ButtonStyleConfiguration

    @Environment(\.isEnabled) private var isEnabled
    @State private var isHovered = false

    var body: some View {
        configuration.label
            .foregroundStyle(Color.accentText)
            .underline(isHovered && isEnabled)
            .opacity(configuration.isPressed ? 0.7 : (isEnabled ? 1 : 0.45))
            .contentShape(.rect)
            .onHover { isHovered = $0 }
            .pointerStyle(.link)
    }
}
