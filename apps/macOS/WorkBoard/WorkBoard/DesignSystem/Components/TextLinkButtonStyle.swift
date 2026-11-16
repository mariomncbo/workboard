import SwiftUI

/// Inline text link in `accent-text`, underlined under the pointer:
/// "Crear una cuenta", "¿Olvidaste la contraseña?".
struct TextLinkButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        TextLinkButtonBody(configuration: configuration)
    }
}

extension ButtonStyle where Self == TextLinkButtonStyle {
    static var textLink: Self { TextLinkButtonStyle() }
}
