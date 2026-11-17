import SwiftUI

/// Planner of a board. Not built yet: shows what it will be.
struct PlannerPanel: View {
    let onClose: () -> Void

    var body: some View {
        BoardSidePanel(panel: .planner, onClose: onClose) {
            ComingSoonPanelContent(
                systemImage: BoardPanel.planner.systemImage,
                message: "Aquí podrás planificar las tareas de este tablero en el calendario."
            )
        }
    }
}
