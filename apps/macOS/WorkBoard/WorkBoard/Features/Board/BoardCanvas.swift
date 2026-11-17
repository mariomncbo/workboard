import SwiftUI

/// The board area next to the side panel: lists (or the empty and loading states) over the
/// board's background, the floating bar centered at the bottom and the error notice on top.
struct BoardCanvas: View {
    let model: BoardModel
    let pointer: PointerTracker
    let openPanel: BoardPanel?
    let onTogglePanel: (BoardPanel) -> Void
    let onReload: () -> Void
    let onAddList: () -> Void
    let onRenameList: (BoardList, String) -> Void
    let onSetListStyle: (BoardList, BoardListStyle) -> Void
    let onDeleteList: (BoardList) -> Void
    let onOpenTask: (BoardTask) -> Void
    let onSetTaskColor: (BoardTask, PaletteColor?) -> Void
    let onDeleteTask: (BoardTask) -> Void

    var body: some View {
        ZStack {
            if model.isLoading && model.lists.isEmpty {
                ProgressView()
                    .controlSize(.small)
            } else if let failure = model.loadFailure, model.lists.isEmpty {
                ContentUnavailableView {
                    Label("No se ha podido cargar el tablero", systemImage: "wifi.exclamationmark")
                } description: {
                    Text(failure.message)
                } actions: {
                    Button("Reintentar", action: onReload)
                        .buttonStyle(.content(.secondary))
                }
            } else if model.lists.isEmpty {
                EmptyBoardView(isOnColor: model.board.background != .dots, onAddList: onAddList)
            } else {
                BoardListsRow(
                    model: model,
                    onRename: onRenameList,
                    onSetStyle: onSetListStyle,
                    onDelete: onDeleteList,
                    onOpenTask: onOpenTask,
                    onSetTaskColor: onSetTaskColor,
                    onDeleteTask: onDeleteTask
                )
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .overlay(alignment: .bottom) {
            FloatingBar(openPanel: openPanel, onTogglePanel: onTogglePanel, onAddList: onAddList)
                .padding(.bottom, Spacing.s10)
        }
        .overlay(alignment: .top) {
            if let failure = model.actionFailure {
                ErrorBanner(message: failure.message, onDismiss: model.dismissActionFailure)
                    .padding(.top, Spacing.s3)
            }
        }
        .background {
            BoardBackdrop(background: model.board.background, pointer: pointer)
        }
    }
}
