import SwiftUI

/// Glass bar centered at the bottom of the board: Notas, Planificador | Añade una lista.
/// Notes and Planner panels are not built yet, so their buttons are disabled.
struct FloatingBar: View {
    let onAddList: () -> Void

    var body: some View {
        GlassEffectContainer {
            HStack(spacing: 2) {
                FloatingBarButton(title: "Notas", systemImage: "note.text", action: {})
                    .disabled(true)
                    .help("Próximamente")
                FloatingBarButton(title: "Planificador", systemImage: "calendar", action: {})
                    .disabled(true)
                    .help("Próximamente")

                Rectangle()
                    .fill(Color.white.opacity(0.14))
                    .frame(width: 1, height: 16)
                    .padding(.horizontal, 2)
                    .accessibilityHidden(true)

                FloatingBarButton(title: "Añade una lista", systemImage: "plus", action: onAddList)
            }
            .padding(3)
            .glassEffect(.regular.interactive(), in: .capsule)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Herramientas del tablero")
    }
}
