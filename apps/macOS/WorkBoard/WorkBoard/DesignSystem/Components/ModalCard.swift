import SwiftUI

/// Card of a modal (Crear tablero, Configuración del tablero, Tarea…), shown centered
/// over the dimmed window with `.modal(item:)`.
struct ModalCard<Content: View>: View {
    let width: Double
    let content: Content

    init(width: Double = 440, @ViewBuilder content: () -> Content) {
        self.width = width
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            content
        }
        .padding(Spacing.s5)
        .frame(width: width, alignment: .leading)
        .background(Color.bgComponent, in: .rect(cornerRadius: Radius.lg))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.lg)
                .strokeBorder(Color.borderSubtle, lineWidth: 1)
        }
        .elevation(.modal)
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(.isModal)
    }
}
