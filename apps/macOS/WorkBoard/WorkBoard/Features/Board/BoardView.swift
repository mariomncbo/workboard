import SwiftUI

/// An open board: its lists side by side over the board's background, and the floating bar.
struct BoardView: View {
    let profile: Profile
    let onGoHome: () -> Void
    let onShowProfile: () -> Void
    let onDeleteAccount: () -> Void

    @State private var model: BoardModel
    @State private var activeModal: BoardModal?
    @State private var deletion: DeletionRequest?
    @State private var pointer = PointerTracker()

    init(
        board: Board,
        profile: Profile,
        boardRepository: BoardRepository,
        listRepository: ListRepository,
        onGoHome: @escaping () -> Void,
        onShowProfile: @escaping () -> Void,
        onDeleteAccount: @escaping () -> Void
    ) {
        self.profile = profile
        self.onGoHome = onGoHome
        self.onShowProfile = onShowProfile
        self.onDeleteAccount = onDeleteAccount
        _model = State(initialValue: BoardModel(board: board, boardRepository: boardRepository, listRepository: listRepository))
    }

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
                    Button("Reintentar", action: reload)
                        .buttonStyle(.content(.secondary))
                }
            } else if model.lists.isEmpty {
                EmptyBoardView(isOnColor: model.board.background != .dots, onAddList: showCreateList)
            } else {
                BoardListsRow(
                    lists: model.lists,
                    onReorder: model.reorder,
                    onRename: rename,
                    onSetStyle: setStyle,
                    onDelete: confirmDeletion
                )
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .overlay(alignment: .bottom) {
            FloatingBar(onAddList: showCreateList)
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
        .onContinuousHover(coordinateSpace: .global) { phase in
            pointer.handle(phase)
        }
        .toolbar {
            BoardToolbar(
                board: model.board,
                profile: profile,
                onGoHome: onGoHome,
                onToggleFavorite: toggleFavorite,
                onShowSettings: showSettings,
                onShowProfile: onShowProfile,
                onDeleteAccount: onDeleteAccount
            )
        }
        .toolbar(removing: .title)
        .modal(item: $activeModal) { modal in
            switch modal {
            case .settings:
                BoardEditorModal(
                    mode: .settings(model.board, model.summary),
                    onSave: model.updateBoard,
                    onDelete: confirmBoardDeletion,
                    onClose: closeModal
                )
            case .createList:
                CreateListModal(onCreate: model.createList, onClose: closeModal)
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

    private func toggleFavorite() {
        Task {
            await model.toggleFavorite()
        }
    }

    private func rename(_ list: BoardList, to name: String) {
        Task {
            await model.rename(list, to: name)
        }
    }

    private func setStyle(_ list: BoardList, _ style: BoardListStyle) {
        Task {
            await model.setStyle(style, of: list)
        }
    }

    private func showSettings() {
        activeModal = .settings
    }

    private func showCreateList() {
        activeModal = .createList
    }

    private func closeModal() {
        activeModal = nil
    }

    private func confirmDeletion(of list: BoardList) {
        let message: LocalizedStringKey = list.taskCount == 0
            ? "Se borrará la lista. Esta acción no se puede deshacer."
            : "Se borrarán la lista y sus ^[\(list.taskCount) tarea](inflect: true). Esta acción no se puede deshacer."

        deletion = DeletionRequest(
            title: "¿Eliminar la lista «\(list.name)»?",
            message: message,
            actionTitle: "Eliminar lista"
        ) {
            try await model.delete(list)
        }
    }

    private func confirmBoardDeletion() {
        let summary = model.summary
        let message: LocalizedStringKey = summary.listCount == 0
            ? "Se borrará el tablero. Esta acción no se puede deshacer."
            : "Se borrarán el tablero, sus ^[\(summary.listCount) lista](inflect: true) y sus ^[\(summary.taskCount) tarea](inflect: true). Esta acción no se puede deshacer."

        deletion = DeletionRequest(
            title: "¿Eliminar «\(model.board.name)»?",
            message: message,
            actionTitle: "Eliminar tablero"
        ) {
            try await model.deleteBoard()
            activeModal = nil
            onGoHome()
        }
    }
}
