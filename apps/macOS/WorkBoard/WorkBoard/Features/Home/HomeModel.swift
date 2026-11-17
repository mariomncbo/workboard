import Foundation

/// Boards of the signed-in user for Home: loading, search, sorting and changes.
///
/// Creating, editing, starring and deleting boards can be undone with ⌘Z and redone
/// with ⇧⌘Z. A deleted board comes back with its lists and tasks. Changes are applied on
/// screen right away and register their opposite synchronously; saving happens afterwards.
@Observable
final class HomeModel {
    private(set) var boards: [Board] = []
    private(set) var summaries: [UUID: BoardSummary] = [:]
    private(set) var isLoading = false
    private(set) var loadFailure: DataFailure?
    /// A change that could not be saved, shown above the grid.
    private(set) var actionFailure: DataFailure?
    var searchText = ""

    /// The window's undo manager. Set by the workspace.
    @ObservationIgnored weak var undoManager: UndoManager?

    @ObservationIgnored private let boardRepository: BoardRepository
    @ObservationIgnored private let listRepository: ListRepository
    @ObservationIgnored private let taskRepository: TaskRepository

    init(boardRepository: BoardRepository, listRepository: ListRepository, taskRepository: TaskRepository) {
        self.boardRepository = boardRepository
        self.listRepository = listRepository
        self.taskRepository = taskRepository
    }

    /// Boards matching the search, favorites first, then the newest.
    var visibleBoards: [Board] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        let matching = query.isEmpty ? boards : boards.filter { $0.name.localizedStandardContains(query) }
        return matching.sorted { first, second in
            if first.isFavorite != second.isFavorite {
                return first.isFavorite
            }
            return first.createdAt > second.createdAt
        }
    }

    var isSearching: Bool {
        !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    func summary(for board: Board) -> BoardSummary {
        summaries[board.id] ?? .empty(for: board.id)
    }

    func load() async {
        isLoading = true
        loadFailure = nil
        defer { isLoading = false }

        do {
            async let boards = boardRepository.fetchBoards()
            async let summaries = boardRepository.fetchSummaries()
            self.boards = try await boards
            self.summaries = try await summaries
        } catch {
            loadFailure = error as? DataFailure ?? .unexpected
        }
    }

    func dismissActionFailure() {
        actionFailure = nil
    }

    // MARK: - Changes

    /// Saves the "Crear tablero" modal. Errors are shown in the modal.
    func create(_ draft: BoardDraft) async throws(DataFailure) {
        let board = try await boardRepository.create(draft)
        boards.append(board)
        registerUndo("Crear tablero") { $0.removeBoard(board, lists: [], tasks: []) }
    }

    /// Saves the board settings modal. Errors are shown in the modal.
    func update(_ board: Board, with draft: BoardDraft) async throws(DataFailure) {
        let previous = BoardDraft(board: self.board(withID: board.id) ?? board)
        let updated = try await boardRepository.update(board.id, with: draft)
        replace(updated)
        registerUndo("Configuración del tablero") { $0.apply(previous, toBoard: board.id) }
    }

    /// Applies board settings without the modal, to undo or redo a change.
    func apply(_ draft: BoardDraft, toBoard boardID: UUID) {
        guard var board = board(withID: boardID) else { return }
        let previous = BoardDraft(board: board)
        guard previous != draft else { return }

        board.name = draft.trimmedName
        let description = draft.description.trimmingCharacters(in: .whitespacesAndNewlines)
        board.description = description.isEmpty ? nil : description
        board.background = draft.background
        board.isFavorite = draft.isFavorite
        replace(board)
        registerUndo("Configuración del tablero") { $0.apply(previous, toBoard: boardID) }
        persist { [boardRepository] () throws(DataFailure) in
            _ = try await boardRepository.update(boardID, with: draft)
        }
    }

    func toggleFavorite(_ board: Board) {
        guard var current = self.board(withID: board.id) else { return }
        current.isFavorite.toggle()
        replace(current)
        let isFavorite = current.isFavorite
        registerUndo(isFavorite ? "Añadir a favoritos" : "Quitar de favoritos") { $0.toggleFavorite(board) }
        persist { [boardRepository] () throws(DataFailure) in
            try await boardRepository.setFavorite(isFavorite, for: board.id)
        }
    }

    /// Deletes a board after its confirmation dialog, from Home or from the board itself.
    /// Its lists and tasks are kept in memory so ⌘Z can bring everything back.
    func delete(_ board: Board) async throws(DataFailure) {
        let lists = try await listRepository.fetchLists(of: board.id)
        let tasks = try await taskRepository.fetchTasks(inLists: lists.map(\.id))
        try await boardRepository.delete(board.id)
        removeLocally(board.id)
        registerUndo("Eliminar tablero") { $0.restore(board, lists: lists, tasks: tasks) }
    }

    /// Deletes a board without asking: undo of "Crear tablero" and redo of "Eliminar tablero".
    func removeBoard(_ board: Board, lists: [BoardList], tasks: [BoardTask]) {
        removeLocally(board.id)
        registerUndo("Eliminar tablero") { $0.restore(board, lists: lists, tasks: tasks) }
        persist { [boardRepository] () throws(DataFailure) in
            try await boardRepository.delete(board.id)
        }
    }

    /// Brings back a deleted board with its lists and tasks, with the same identifiers and data.
    func restore(_ board: Board, lists: [BoardList], tasks: [BoardTask]) {
        guard self.board(withID: board.id) == nil else { return }
        boards.append(board)
        summaries[board.id] = BoardSummary(boardID: board.id, listCount: lists.count, taskCount: tasks.count)
        registerUndo("Eliminar tablero") { $0.removeBoard(board, lists: lists, tasks: tasks) }
        persist { [boardRepository, listRepository, taskRepository] () throws(DataFailure) in
            try await boardRepository.restore(board)
            try await listRepository.restore(lists)
            try await taskRepository.restore(tasks)
        }
    }

    // MARK: - Helpers

    private func board(withID id: UUID) -> Board? {
        boards.first { $0.id == id }
    }

    private func replace(_ board: Board) {
        guard let index = boards.firstIndex(where: { $0.id == board.id }) else { return }
        boards[index] = board
    }

    private func removeLocally(_ id: UUID) {
        boards.removeAll { $0.id == id }
        summaries[id] = nil
    }

    /// Registers the opposite of a change with the window's undo manager. The handler runs
    /// synchronously and registers its own opposite, which makes redo work.
    private func registerUndo(_ actionName: LocalizedStringResource, _ handler: @escaping (HomeModel) -> Void) {
        guard let undoManager else { return }
        undoManager.registerUndo(withTarget: self, handler: handler)
        undoManager.setActionName(String(localized: actionName))
    }

    /// Saves a change already shown on screen. If saving fails, reloads the boards so the
    /// screen matches the database again, and shows the error.
    private func persist(_ save: @escaping () async throws(DataFailure) -> Void) {
        actionFailure = nil
        Task {
            do {
                try await save()
            } catch {
                actionFailure = error as? DataFailure ?? .unexpected
                await load()
            }
        }
    }
}
