import SwiftUI

/// The app's menu bar: File (new board, new list), Edit (search), Board and View
/// (Notes, Planner), with the shortcuts of the design system. ⌘, (Settings) and
/// ⌘Z (undo) come from the system.
struct WorkBoardCommands: Commands {
    @FocusedValue(\.workspaceCommand) private var command
    @FocusedValue(\.workspaceMenuState) private var state

    var body: some Commands {
        // Replaces "New Window": WorkBoard works in a single window.
        CommandGroup(replacing: .newItem) {
            Button("Nuevo tablero…") { send(.createBoard) }
                .keyboardShortcut("n")
                .disabled(state?.isHome != true)
            Button("Nueva lista…") { send(.addList) }
                .keyboardShortcut("n", modifiers: [.command, .shift])
                .disabled(state?.isBoard != true)
        }

        CommandGroup(replacing: .textEditing) {
            Button("Buscar tableros") { send(.findBoards) }
                .keyboardShortcut("f")
                .disabled(state?.isHome != true)
        }

        CommandMenu("Tablero") {
            Button(state?.isFavoriteBoard == true ? "Quitar de favoritos" : "Añadir a favoritos") {
                send(.toggleFavorite)
            }
            .keyboardShortcut("d")
            .disabled(state?.isBoard != true)

            Button("Configuración del tablero…") { send(.showBoardSettings) }
                .keyboardShortcut("i")
                .disabled(state?.isBoard != true)

            Divider()

            Button("Volver a Inicio") { send(.goHome) }
                .disabled(state?.isBoard != true)

            Divider()

            Button("Eliminar tablero…") { send(.deleteBoard) }
                .keyboardShortcut(.delete)
                .disabled(state?.isBoard != true)
        }

        CommandGroup(before: .toolbar) {
            Toggle("Notas", isOn: panelBinding(.notes))
                .keyboardShortcut("1", modifiers: [.command, .option])
                .disabled(state?.isBoard != true)
            Toggle("Planificador", isOn: panelBinding(.planner))
                .keyboardShortcut("2", modifiers: [.command, .option])
                .disabled(state?.isBoard != true)
            Divider()
        }
    }

    private func send(_ newCommand: WorkspaceCommand) {
        command?.wrappedValue = newCommand
    }

    /// Checked when the panel is open; choosing it opens or closes the panel.
    private func panelBinding(_ panel: BoardPanel) -> Binding<Bool> {
        Binding {
            state?.openPanel == panel
        } set: { _ in
            send(.togglePanel(panel))
        }
    }
}
