import SwiftUI

/// An open board with its lists and tasks: loading, creating, editing, moving and deleting
/// them, and editing the board itself.
///
/// Every change can be undone with ⌘Z (and redone with ⇧⌘Z) while the board is open.
/// Changes are applied on screen right away and register their opposite synchronously,
/// so undo and redo stay paired; saving to Supabase happens afterwards. If saving fails,
/// the board reloads to match the database and the error is shown.
@Observable
final class BoardModel {
    private(set) var board: Board
    private(set) var lists: [BoardList] = []
    /// Tasks of each list, in order.
    private(set) var tasksByList: [UUID: [BoardTask]] = [:]
    private(set) var isLoading = false
    private(set) var loadFailure: DataFailure?
    /// A change that could not be saved.
    private(set) var actionFailure: DataFailure?

    /// The window's undo manager. Set by the board view.
    @ObservationIgnored weak var undoManager: UndoManager?

    @ObservationIgnored private let boardRepository: BoardRepository
    @ObservationIgnored private let listRepository: ListRepository
    @ObservationIgnored private let taskRepository: TaskRepository

    init(
        board: Board,
        boardRepository: BoardRepository,
        listRepository: ListRepository,
        taskRepository: TaskRepository
    ) {
        self.board = board
        self.boardRepository = boardRepository
        self.listRepository = listRepository
        self.taskRepository = taskRepository
    }

    var summary: BoardSummary {
        BoardSummary(
            boardID: board.id,
            listCount: lists.count,
            taskCount: lists.reduce(0) { $0 + $1.taskCount }
        )
    }

    func tasks(in list: BoardList) -> [BoardTask] {
        tasksByList[list.id] ?? []
    }

    func list(withID id: UUID) -> BoardList? {
        lists.first { $0.id == id }
    }

    func load() async {
        isLoading = true
        loadFailure = nil
        defer { isLoading = false }

        do {
            let lists = try await listRepository.fetchLists(of: board.id)
            let tasks = try await taskRepository.fetchTasks(inLists: lists.map(\.id))
            self.lists = lists
            tasksByList = Dictionary(grouping: tasks, by: \.listID)
            syncTaskCounts()
        } catch {
            loadFailure = error
        }
    }

    func dismissActionFailure() {
        actionFailure = nil
    }

    // MARK: - Lists

    /// Adds a list at the end of the board.
    func createList(named name: String, style: BoardListStyle) async throws(DataFailure) {
        let list = try await listRepository.create(
            NewBoardList(boardID: board.id, name: name, style: style, position: FractionalPosition.after(lists.last?.position))
        )
        lists.append(list)
        registerUndo("Crear lista") { $0.removeList(list) }
    }

    func rename(_ list: BoardList, to name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed.count <= BoardList.maximumNameLength,
              let current = self.list(withID: list.id), trimmed != current.name else { return }

        updateList(list.id) { $0.name = trimmed }
        registerUndo("Renombrar lista") { $0.rename(current, to: current.name) }
        persist { [listRepository] () throws(DataFailure) in
            try await listRepository.rename(list.id, to: trimmed)
        }
    }

    func setStyle(_ style: BoardListStyle, of list: BoardList) {
        guard let current = self.list(withID: list.id), style != current.style else { return }

        updateList(list.id) { $0.style = style }
        registerUndo("Cambiar estilo") { $0.setStyle(current.style, of: current) }
        persist { [listRepository] () throws(DataFailure) in
            try await listRepository.setStyle(style, of: list.id)
        }
    }

    /// Moves a dragged list to the place of the list it was dropped on: after it when coming
    /// from the left, before it when coming from the right.
    func moveList(_ listID: UUID, onto targetID: UUID) {
        guard listID != targetID,
              let sourceIndex = lists.firstIndex(where: { $0.id == listID }),
              let targetIndex = lists.firstIndex(where: { $0.id == targetID }) else { return }

        var order = lists
        let moved = order.remove(at: sourceIndex)
        // After removing the source, the target's old index is right after the target when
        // moving right, and right before it when moving left.
        order.insert(moved, at: targetIndex)
        let previous = targetIndex > 0 ? order[targetIndex - 1].position : nil
        let next = targetIndex < order.count - 1 ? order[targetIndex + 1].position : nil

        setPosition(FractionalPosition.between(previous, and: next), ofList: listID)
    }

    /// Places a list at a position. Used by drag and drop, and to undo a move.
    func setPosition(_ position: Double, ofList listID: UUID) {
        guard let current = list(withID: listID), current.position != position else { return }

        updateList(listID) { $0.position = position }
        lists.sort { $0.position < $1.position }
        registerUndo("Mover lista") { $0.setPosition(current.position, ofList: listID) }
        persist { [listRepository] () throws(DataFailure) in
            try await listRepository.setPosition(position, of: listID)
        }
    }

    /// Deletes a list after its confirmation dialog. Errors are shown in the dialog.
    func delete(_ list: BoardList) async throws(DataFailure) {
        let tasks = tasks(in: list)
        try await listRepository.delete(list.id)
        removeListLocally(list.id)
        registerUndo("Eliminar lista") { $0.restoreList(list, tasks: tasks) }
    }

    /// Deletes a list without asking: undo of "Crear lista" and redo of "Eliminar lista".
    func removeList(_ list: BoardList) {
        let tasks = tasks(in: list)
        removeListLocally(list.id)
        registerUndo("Eliminar lista") { $0.restoreList(list, tasks: tasks) }
        persist { [listRepository] () throws(DataFailure) in
            try await listRepository.delete(list.id)
        }
    }

    /// Brings back a deleted list with its tasks, with the same identifiers and data.
    func restoreList(_ list: BoardList, tasks: [BoardTask]) {
        guard self.list(withID: list.id) == nil else { return }

        lists.append(list)
        lists.sort { $0.position < $1.position }
        tasksByList[list.id] = tasks
        syncTaskCounts()
        registerUndo("Eliminar lista") { $0.removeList(list) }
        persist { [listRepository, taskRepository] () throws(DataFailure) in
            try await listRepository.restore([list])
            try await taskRepository.restore(tasks)
        }
    }

    // MARK: - Tasks

    /// Adds a task at the end of the list.
    func addTask(named name: String, to list: BoardList) async throws(DataFailure) {
        let task = try await taskRepository.create(
            NewBoardTask(listID: list.id, name: name, position: FractionalPosition.after(tasks(in: list).last?.position))
        )
        tasksByList[list.id, default: []].append(task)
        syncTaskCounts()
        registerUndo("Añadir tarea") { $0.removeTask(task) }
    }

    /// Saves the task modal. Errors are shown in the modal.
    func updateTask(_ task: BoardTask, with draft: TaskDraft) async throws(DataFailure) {
        guard let current = self.task(withID: task.id) else { return }
        let updated = try await taskRepository.update(task.id, with: draft)
        replace(updated)
        registerUndo("Editar tarea") { $0.apply(TaskDraft(task: current), toTask: task.id) }
    }

    func setColor(_ color: PaletteColor?, of task: BoardTask) {
        guard let current = self.task(withID: task.id), color != current.color else { return }
        var draft = TaskDraft(task: current)
        draft.color = color
        apply(draft, toTask: task.id, actionName: "Cambiar color")
    }

    /// Applies a task's name, description and color. Used to change the color and to undo edits.
    func apply(_ draft: TaskDraft, toTask taskID: UUID, actionName: LocalizedStringResource = "Editar tarea") {
        guard var task = task(withID: taskID) else { return }
        let previous = TaskDraft(task: task)
        guard previous != draft else { return }

        task.name = draft.trimmedName
        let description = draft.description.trimmingCharacters(in: .whitespacesAndNewlines)
        task.description = description.isEmpty ? nil : description
        task.color = draft.color
        replace(task)
        registerUndo(actionName) { $0.apply(previous, toTask: taskID, actionName: actionName) }
        persist { [taskRepository] () throws(DataFailure) in
            _ = try await taskRepository.update(taskID, with: draft)
        }
    }

    /// Moves a dropped task: just before the task it was dropped on, or at the end of the list.
    func moveTask(_ taskID: UUID, toList listID: UUID, before followingID: UUID?) {
        guard taskID != followingID, list(withID: listID) != nil else { return }

        let others = (tasksByList[listID] ?? []).filter { $0.id != taskID }
        let index = followingID.flatMap { id in others.firstIndex { $0.id == id } } ?? others.endIndex
        let previous = index > 0 ? others[index - 1].position : nil
        let next = index < others.count ? others[index].position : nil

        place(taskID, inList: listID, at: FractionalPosition.between(previous, and: next))
    }

    /// Puts a task in a list at a position. Used by drag and drop, and to undo a move.
    func place(_ taskID: UUID, inList listID: UUID, at position: Double) {
        guard var task = task(withID: taskID), list(withID: listID) != nil else { return }
        let origin = (listID: task.listID, position: task.position)
        guard origin.listID != listID || origin.position != position else { return }

        tasksByList[task.listID]?.removeAll { $0.id == taskID }
        task.listID = listID
        task.position = position
        tasksByList[listID, default: []].append(task)
        tasksByList[listID]?.sort { $0.position < $1.position }
        syncTaskCounts()

        registerUndo("Mover tarea") { $0.place(taskID, inList: origin.listID, at: origin.position) }
        persist { [taskRepository] () throws(DataFailure) in
            try await taskRepository.move(taskID, to: TaskPlacement(listID: listID, position: position))
        }
    }

    /// Deletes a task after its confirmation dialog. Errors are shown in the dialog.
    func deleteTask(_ task: BoardTask) async throws(DataFailure) {
        guard let current = self.task(withID: task.id) else { return }
        try await taskRepository.delete(task.id)
        tasksByList[current.listID]?.removeAll { $0.id == task.id }
        syncTaskCounts()
        registerUndo("Eliminar tarea") { $0.restoreTask(current) }
    }

    /// Deletes a task without asking: undo of "Añadir tarea" and redo of "Eliminar tarea".
    func removeTask(_ task: BoardTask) {
        guard let current = self.task(withID: task.id) else { return }
        tasksByList[current.listID]?.removeAll { $0.id == task.id }
        syncTaskCounts()
        registerUndo("Eliminar tarea") { $0.restoreTask(current) }
        persist { [taskRepository] () throws(DataFailure) in
            try await taskRepository.delete(task.id)
        }
    }

    /// Brings back a deleted task with the same identifier and data.
    func restoreTask(_ task: BoardTask) {
        guard self.task(withID: task.id) == nil, list(withID: task.listID) != nil else { return }
        tasksByList[task.listID, default: []].append(task)
        tasksByList[task.listID]?.sort { $0.position < $1.position }
        syncTaskCounts()
        registerUndo("Eliminar tarea") { $0.removeTask(task) }
        persist { [taskRepository] () throws(DataFailure) in
            try await taskRepository.restore([task])
        }
    }

    // MARK: - Board

    /// Saves the board settings modal. Errors are shown in the modal.
    func updateBoard(with draft: BoardDraft) async throws(DataFailure) {
        let previous = BoardDraft(board: board)
        board = try await boardRepository.update(board.id, with: draft)
        registerUndo("Configuración del tablero") { $0.apply(previous) }
    }

    /// Applies board settings without the modal, to undo or redo a change.
    func apply(_ draft: BoardDraft) {
        let previous = BoardDraft(board: board)
        guard previous != draft else { return }

        board.name = draft.trimmedName
        let description = draft.description.trimmingCharacters(in: .whitespacesAndNewlines)
        board.description = description.isEmpty ? nil : description
        board.background = draft.background
        board.isFavorite = draft.isFavorite
        registerUndo("Configuración del tablero") { $0.apply(previous) }
        persist { [boardRepository, board] () throws(DataFailure) in
            _ = try await boardRepository.update(board.id, with: draft)
        }
    }

    func toggleFavorite() {
        board.isFavorite.toggle()
        let isFavorite = board.isFavorite
        registerUndo(isFavorite ? "Añadir a favoritos" : "Quitar de favoritos") { $0.toggleFavorite() }
        persist { [boardRepository, board] () throws(DataFailure) in
            try await boardRepository.setFavorite(isFavorite, for: board.id)
        }
    }

    // MARK: - Helpers

    private func task(withID id: UUID) -> BoardTask? {
        tasksByList.values.lazy.flatMap { $0 }.first { $0.id == id }
    }

    private func updateList(_ id: UUID, _ change: (inout BoardList) -> Void) {
        guard let index = lists.firstIndex(where: { $0.id == id }) else { return }
        change(&lists[index])
    }

    private func removeListLocally(_ id: UUID) {
        lists.removeAll { $0.id == id }
        tasksByList[id] = nil
    }

    /// Keeps the task count of each list header in step with the loaded tasks.
    private func syncTaskCounts() {
        for index in lists.indices {
            lists[index].taskCount = tasksByList[lists[index].id]?.count ?? 0
        }
    }

    private func replace(_ task: BoardTask) {
        guard let index = tasksByList[task.listID]?.firstIndex(where: { $0.id == task.id }) else { return }
        tasksByList[task.listID]?[index] = task
    }

    /// Registers the opposite of a change with the window's undo manager. The handler runs
    /// synchronously and registers its own opposite, which makes redo work.
    private func registerUndo(_ actionName: LocalizedStringResource, _ handler: @escaping (BoardModel) -> Void) {
        guard let undoManager else { return }
        undoManager.registerUndo(withTarget: self, handler: handler)
        undoManager.setActionName(String(localized: actionName))
    }

    /// Saves a change already shown on screen. If saving fails, reloads the board so the
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
