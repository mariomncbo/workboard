import SwiftUI

/// Glass bar centered at the bottom of the board: Notas, Planificador | Añade una lista.
/// The button of the open panel is highlighted; pressing it again closes the panel.
struct FloatingBar: View {
    let openPanel: BoardPanel?
    let onTogglePanel: (BoardPanel) -> Void
    let onAddList: () -> Void

    var body: some View {
        GlassEffectContainer {
            HStack(spacing: 2) {
                FloatingBarButton(
                    title: "Notas",
                    systemImage: BoardPanel.notes.systemImage,
                    isActive: openPanel == .notes
                ) {
                    onTogglePanel(.notes)
                }
                FloatingBarButton(
                    title: "Planificador",
                    systemImage: BoardPanel.planner.systemImage,
                    isActive: openPanel == .planner
                ) {
                    onTogglePanel(.planner)
                }

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
