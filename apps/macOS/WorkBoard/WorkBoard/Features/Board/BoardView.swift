import SwiftUI

/// An open board: its lists side by side over the board's background, and the floating bar.
struct BoardView: View {
    let profile: Profile
    let onGoHome: () -> Void
    let onShowProfile: () -> Void
    let onDeleteAccount: () -> Void
    /// Deletes the board (through Home, so the deletion can be undone from there).
    let onDeleteBoard: (Board) async throws(DataFailure) -> Void

    @State private var model: BoardModel
    @State private var activeModal: BoardModal?
    @State private var deletion: DeletionRequest?
    @State private var pointer = PointerTracker()
    @State private var openPanel: BoardPanel?
    @State private var pendingCommand: WorkspaceCommand?
    @Environment(\.undoManager) private var undoManager
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(
        board: Board,
        profile: Profile,
        boardRepository: BoardRepository,
        listRepository: ListRepository,
        taskRepository: TaskRepository,
        onGoHome: @escaping () -> Void,
        onShowProfile: @escaping () -> Void,
        onDeleteAccount: @escaping () -> Void,
        onDeleteBoard: @escaping (Board) async throws(DataFailure) -> Void
    ) {
        self.profile = profile
        self.onGoHome = onGoHome
        self.onShowProfile = onShowProfile
        self.onDeleteAccount = onDeleteAccount
        self.onDeleteBoard = onDeleteBoard
        _model = State(initialValue: BoardModel(
            board: board,
            boardRepository: boardRepository,
            listRepository: listRepository,
            taskRepository: taskRepository
        ))
    }

    var body: some View {
        HStack(spacing: 0) {
            switch openPanel {
            case .notes:
                NotesPanel(onClose: closePanel)
                    .transition(panelTransition)
            case .planner:
                PlannerPanel(onClose: closePanel)
                    .transition(panelTransition)
            case nil:
                EmptyView()
            }

            BoardCanvas(
                model: model,
                pointer: pointer,
                openPanel: openPanel,
                onTogglePanel: togglePanel,
                onReload: reload,
                onAddList: showCreateList,
                onRenameList: rename,
                onSetListStyle: setStyle,
                onDeleteList: confirmDeletion,
                onOpenTask: openTask,
                onSetTaskColor: setColor,
                onDeleteTask: confirmTaskDeletion
            )
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
            case .task(let task):
                TaskModal(
                    task: task,
                    listName: model.list(withID: task.listID)?.name ?? "",
                    onSave: { draft throws(DataFailure) in try await model.updateTask(task, with: draft) },
                    onDelete: { confirmTaskDeletion(task) },
                    onClose: closeModal
                )
            }
        }
        .deletionConfirmation($deletion)
        .focusedSceneValue(\.workspaceCommand, $pendingCommand)
        .focusedSceneValue(
            \.workspaceMenuState,
            WorkspaceMenuState(
                screen: .board(isFavorite: model.board.isFavorite, openPanel: openPanel),
                isModalPresented: activeModal != nil || deletion != nil
            )
        )
        .onChange(of: pendingCommand) { _, command in
            guard let command else { return }
            pendingCommand = nil
            perform(command)
        }
        .onAppear {
            model.undoManager = undoManager
        }
        .onDisappear {
            // Board changes can only be undone while the board is open.
            undoManager?.removeAllActions(withTarget: model)
        }
        .task {
            await model.load()
        }
    }

    // MARK: - Actions

    /// Performs a menu bar command that applies to a board.
    private func perform(_ command: WorkspaceCommand) {
        switch command {
        case .addList: showCreateList()
        case .toggleFavorite: toggleFavorite()
        case .showBoardSettings: showSettings()
        case .deleteBoard: confirmBoardDeletion()
        case .togglePanel(let panel): togglePanel(panel)
        case .goHome: onGoHome()
        case .createBoard, .findBoards: break
        }
    }

    /// Panels slide in from the left; with Reduce Motion they only fade.
    private var panelTransition: AnyTransition {
        reduceMotion ? .opacity : .move(edge: .leading).combined(with: .opacity)
    }

    /// Opens a panel (closing the other one), or closes it if it is already open.
    private func togglePanel(_ panel: BoardPanel) {
        withAnimation(reduceMotion ? .easeInOut(duration: 0.2) : .spring(duration: 0.3)) {
            openPanel = openPanel == panel ? nil : panel
        }
    }

    private func closePanel() {
        withAnimation(reduceMotion ? .easeInOut(duration: 0.2) : .spring(duration: 0.3)) {
            openPanel = nil
        }
    }

    private func reload() {
        Task {
            await model.load()
        }
    }

    private func toggleFavorite() {
        model.toggleFavorite()
    }

    private func rename(_ list: BoardList, to name: String) {
        model.rename(list, to: name)
    }

    private func setStyle(_ list: BoardList, _ style: BoardListStyle) {
        model.setStyle(style, of: list)
    }

    private func openTask(_ task: BoardTask) {
        activeModal = .task(task)
    }

    private func setColor(_ task: BoardTask, _ color: PaletteColor?) {
        model.setColor(color, of: task)
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

    private func confirmTaskDeletion(_ task: BoardTask) {
        deletion = DeletionRequest(
            title: "¿Eliminar la tarea «\(task.name)»?",
            message: "Esta acción no se puede deshacer.",
            actionTitle: "Eliminar tarea"
        ) {
            try await model.deleteTask(task)
            activeModal = nil
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
            try await onDeleteBoard(model.board)
            activeModal = nil
            onGoHome()
        }
    }
}
