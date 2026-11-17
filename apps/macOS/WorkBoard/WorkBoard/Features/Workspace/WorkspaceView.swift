import SwiftUI

/// The signed-in app: Home or an open board, plus the account modals of the user menu,
/// which work the same on both screens.
struct WorkspaceView: View {
    let profile: Profile
    let boardRepository: BoardRepository
    let listRepository: ListRepository
    let taskRepository: TaskRepository

    @Environment(AuthService.self) private var auth
    /// Kept while a board is open, so Home shows its boards right away when coming back.
    @State private var homeModel: HomeModel
    @State private var openBoard: Board?
    @State private var accountModal: AccountModal?
    @State private var accountDeletion: DeletionRequest?
    @Environment(\.undoManager) private var undoManager

    init(
        profile: Profile,
        boardRepository: BoardRepository,
        listRepository: ListRepository,
        taskRepository: TaskRepository
    ) {
        self.profile = profile
        self.boardRepository = boardRepository
        self.listRepository = listRepository
        self.taskRepository = taskRepository
        _homeModel = State(initialValue: HomeModel(
            boardRepository: boardRepository,
            listRepository: listRepository,
            taskRepository: taskRepository
        ))
    }

    var body: some View {
        ZStack {
            if let openBoard {
                BoardView(
                    board: openBoard,
                    profile: profile,
                    boardRepository: boardRepository,
                    listRepository: listRepository,
                    taskRepository: taskRepository,
                    onGoHome: goHome,
                    onShowProfile: showProfile,
                    onDeleteAccount: confirmAccountDeletion,
                    onDeleteBoard: homeModel.delete
                )
                .id(openBoard.id)
            } else {
                HomeView(
                    profile: profile,
                    model: homeModel,
                    onOpenBoard: open,
                    onShowProfile: showProfile,
                    onDeleteAccount: confirmAccountDeletion
                )
            }
        }
        .modal(item: $accountModal) { _ in
            ProfileModal(profile: profile, onClose: closeAccountModal)
        }
        .deletionConfirmation($accountDeletion)
        .onAppear {
            homeModel.undoManager = undoManager
        }
        .onDisappear {
            undoManager?.removeAllActions(withTarget: homeModel)
        }
    }

    private func open(_ board: Board) {
        openBoard = board
    }

    private func goHome() {
        openBoard = nil
    }

    private func showProfile() {
        accountModal = .profile
    }

    private func closeAccountModal() {
        accountModal = nil
    }

    private func confirmAccountDeletion() {
        accountDeletion = DeletionRequest(
            title: "¿Eliminar tu cuenta?",
            message: "Se borrarán tu perfil, tus tableros, sus listas y sus tareas. Esta acción no se puede deshacer.",
            actionTitle: "Eliminar cuenta",
            confirmationPhrase: profile.nickname
        ) {
            try await auth.deleteAccount()
        }
    }
}
