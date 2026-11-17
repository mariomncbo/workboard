import SwiftUI

/// Notes of a board. Not built yet: shows what it will be.
struct NotesPanel: View {
    let onClose: () -> Void

    var body: some View {
        BoardSidePanel(panel: .notes, onClose: onClose) {
            ComingSoonPanelContent(
                systemImage: BoardPanel.notes.systemImage,
                message: "Aquí podrás escribir notas ligadas a este tablero."
            )
        }
    }
}
