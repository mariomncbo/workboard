import SwiftUI

/// Home: "Mi espacio de trabajo" with the user's boards, favorites first.
struct HomeView: View {
    let profile: Profile
    @Bindable var model: HomeModel
    let onOpenBoard: (Board) -> Void
    let onShowProfile: () -> Void
    let onDeleteAccount: () -> Void

    @State private var activeModal: HomeModal?
    @State private var deletion: DeletionRequest?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.s5) {
                HomeHeader(boardCount: model.boards.count)

                if let failure = model.actionFailure {
                    FieldMessageView(message: .error(failure.message))
                }

                if model.isLoading && model.boards.isEmpty {
                    ProgressView()
                        .controlSize(.small)
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if let failure = model.loadFailure, model.boards.isEmpty {
                    ContentUnavailableView {
                        Label("No se han podido cargar tus tableros", systemImage: "wifi.exclamationmark")
                    } description: {
                        Text(failure.message)
                    } actions: {
                        Button("Reintentar", action: reload)
                            .buttonStyle(.content(.secondary))
                    }
                } else if model.boards.isEmpty {
                    ContentUnavailableView {
                        Label("Crea tu primer tablero", systemImage: "rectangle.3.group")
                    } description: {
                        Text("Organiza tu trabajo en listas y tareas.")
                    } actions: {
                        Button("Crear tablero", action: showCreateBoard)
                            .buttonStyle(.content(.primary))
                    }
                } else if model.visibleBoards.isEmpty {
                    ContentUnavailableView.search(text: model.searchText)
                } else {
                    BoardGrid(
                        boards: model.visibleBoards,
                        summary: model.summary(for:),
                        onOpen: onOpenBoard,
                        onToggleFavorite: toggleFavorite,
                        onShowSettings: showSettings,
                        onDelete: confirmDeletion,
                        onCreate: showCreateBoard
                    )
                }
            }
            .padding(.horizontal, Spacing.s10)
            .padding(.top, Spacing.s7)
            .padding(.bottom, Spacing.s10)
        }
        .appBackground()
        .toolbar {
            HomeToolbar(
                profile: profile,
                onCreateBoard: showCreateBoard,
                onShowProfile: onShowProfile,
                onDeleteAccount: onDeleteAccount
            )
        }
        .toolbar(removing: .title)
        .searchable(text: $model.searchText, placement: .toolbarPrincipal, prompt: "Buscar tableros")
        .modal(item: $activeModal) { modal in
            switch modal {
            case .createBoard:
                BoardEditorModal(mode: .create, onSave: model.create, onClose: closeModal)
            case .boardSettings(let board):
                BoardEditorModal(
                    mode: .settings(board, model.summary(for: board)),
                    onSave: { draft throws(DataFailure) in try await model.update(board, with: draft) },
                    onDelete: { confirmDeletion(of: board) },
                    onClose: closeModal
                )
            }
        }
        .deletionConfirmation($deletion)
        .task {
            await model.load()
        }
    }

    // MARK: - Actions

    private func reload() {
        Task {
            await model.load()
        }
    }

    private func toggleFavorite(_ board: Board) {
        Task {
            await model.toggleFavorite(board)
        }
    }

    private func showCreateBoard() {
        activeModal = .createBoard
    }

    private func showSettings(_ board: Board) {
        activeModal = .boardSettings(board)
    }

    private func closeModal() {
        activeModal = nil
    }

    private func confirmDeletion(of board: Board) {
        let summary = model.summary(for: board)
        let message: LocalizedStringKey = summary.listCount == 0
            ? "Se borrará el tablero. Esta acción no se puede deshacer."
            : "Se borrarán el tablero, sus ^[\(summary.listCount) lista](inflect: true) y sus ^[\(summary.taskCount) tarea](inflect: true). Esta acción no se puede deshacer."

        deletion = DeletionRequest(
            title: "¿Eliminar «\(board.name)»?",
            message: message,
            actionTitle: "Eliminar tablero"
        ) {
            try await model.delete(board)
            activeModal = nil
        }
    }
}
