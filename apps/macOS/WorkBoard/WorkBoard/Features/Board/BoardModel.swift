import SwiftUI

/// An open board with its lists and tasks: loading, creating, editing, reordering and
/// deleting them, and editing the board itself.
@Observable
final class BoardModel {
    private(set) var board: Board
    private(set) var lists: [BoardList] = []
    /// Tasks of each list, in order.
    private(set) var tasksByList: [UUID: [BoardTask]] = [:]
    private(set) var isLoading = false
    private(set) var loadFailure: DataFailure?
    /// A change that could not be saved; it was reverted.
    private(set) var actionFailure: DataFailure?

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

    // MARK: - Lists

    /// Adds a list at the end of the board.
    func createList(named name: String, style: BoardListStyle) async throws(DataFailure) {
        let list = try await listRepository.create(
            NewBoardList(boardID: board.id, name: name, style: style, position: FractionalPosition.after(lists.last?.position))
        )
        lists.append(list)
    }

    func rename(_ list: BoardList, to name: String) async {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, trimmed.count <= BoardList.maximumNameLength, trimmed != list.name else { return }

        await change(list) { $0.name = trimmed } save: { [listRepository] () throws(DataFailure) in
            try await listRepository.rename(list.id, to: trimmed)
        }
    }

    func setStyle(_ style: BoardListStyle, of list: BoardList) async {
        guard style != list.style else { return }
        await change(list) { $0.style = style } save: { [listRepository] () throws(DataFailure) in
            try await listRepository.setStyle(style, of: list.id)
        }
    }

    /// Moves a dragged list to the place of the list it was dropped on: after it when coming
    /// from the left, before it when coming from the right. Saves only the moved list.
    func moveList(_ listID: UUID, onto targetID: UUID) {
        guard listID != targetID,
              let sourceIndex = lists.firstIndex(where: { $0.id == listID }),
              let targetIndex = lists.firstIndex(where: { $0.id == targetID }) else { return }

        var moved = lists.remove(at: sourceIndex)
        // After removing the source, inserting at the target's old index lands right after the
        // target when moving right, and right before it when moving left.
        lists.insert(moved, at: targetIndex)

        let previous = targetIndex > 0 ? lists[targetIndex - 1].position : nil
        let next = targetIndex < lists.count - 1 ? lists[targetIndex + 1].position : nil
        moved.position = FractionalPosition.between(previous, and: next)
        lists[targetIndex] = moved

        let position = moved.position
        persist { [listRepository] () throws(DataFailure) in
            try await listRepository.setPosition(position, of: listID)
        }
    }

    /// Deletes the list; the database deletes its tasks.
    func delete(_ list: BoardList) async throws(DataFailure) {
        try await listRepository.delete(list.id)
        lists.removeAll { $0.id == list.id }
        tasksByList[list.id] = nil
    }

    // MARK: - Tasks

    /// Adds a task at the end of the list.
    func addTask(named name: String, to list: BoardList) async throws(DataFailure) {
        let task = try await taskRepository.create(
            NewBoardTask(listID: list.id, name: name, position: FractionalPosition.after(tasks(in: list).last?.position))
        )
        tasksByList[list.id, default: []].append(task)
        syncTaskCounts()
    }

    func updateTask(_ task: BoardTask, with draft: TaskDraft) async throws(DataFailure) {
        let updated = try await taskRepository.update(task.id, with: draft)
        replace(updated)
    }

    /// Changes the color right away and reverts it if it cannot be saved.
    func setColor(_ color: PaletteColor?, of task: BoardTask) async {
        guard color != task.color else { return }
        var draft = TaskDraft(task: task)
        draft.color = color
        var changed = task
        changed.color = color
        replace(changed)
        actionFailure = nil

        do {
            _ = try await taskRepository.update(task.id, with: draft)
        } catch {
            replace(task)
            actionFailure = error
        }
    }

    /// Moves a dropped task right away, then saves its new list and position.
    /// - Parameters:
    ///   - taskID: The dragged task.
    ///   - listID: The list it was dropped on.
    ///   - followingID: The task it was dropped on, to go just before it; `nil` puts it at the end.
    func moveTask(_ taskID: UUID, toList listID: UUID, before followingID: UUID?) {
        guard taskID != followingID,
              list(withID: listID) != nil,
              let task = tasksByList.values.lazy.flatMap({ $0 }).first(where: { $0.id == taskID }) else { return }

        tasksByList[task.listID]?.removeAll { $0.id == taskID }

        var destination = tasksByList[listID] ?? []
        let index = followingID.flatMap { id in destination.firstIndex { $0.id == id } } ?? destination.endIndex
        let previous = index > 0 ? destination[index - 1].position : nil
        let next = index < destination.count ? destination[index].position : nil

        var moved = task
        moved.listID = listID
        moved.position = FractionalPosition.between(previous, and: next)
        destination.insert(moved, at: index)
        tasksByList[listID] = destination
        syncTaskCounts()

        let placement = TaskPlacement(listID: listID, position: moved.position)
        persist { [taskRepository] () throws(DataFailure) in
            try await taskRepository.move(taskID, to: placement)
        }
    }

    func deleteTask(_ task: BoardTask) async throws(DataFailure) {
        try await taskRepository.delete(task.id)
        tasksByList[task.listID]?.removeAll { $0.id == task.id }
        syncTaskCounts()
    }

    // MARK: - Board

    func updateBoard(with draft: BoardDraft) async throws(DataFailure) {
        board = try await boardRepository.update(board.id, with: draft)
    }

    /// Changes the star right away and reverts it if it cannot be saved.
    func toggleFavorite() async {
        let original = board
        board.isFavorite.toggle()
        actionFailure = nil
        do {
            try await boardRepository.setFavorite(board.isFavorite, for: board.id)
        } catch {
            board = original
            actionFailure = error
        }
    }

    func deleteBoard() async throws(DataFailure) {
        try await boardRepository.delete(board.id)
    }

    func dismissActionFailure() {
        actionFailure = nil
    }

    // MARK: - Helpers

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

    /// Saves changes already shown on screen. If saving fails, reloads the board so the
    /// screen matches the database again, and shows the error.
    private func persist(_ save: @escaping () async throws(DataFailure) -> Void) {
        Task {
            do {
                try await save()
            } catch {
                actionFailure = error as? DataFailure ?? .unexpected
                await load()
            }
        }
    }

    /// Applies a change to a list right away and reverts it if saving fails.
    private func change(
        _ list: BoardList,
        apply: (inout BoardList) -> Void,
        save: () async throws(DataFailure) -> Void
    ) async {
        guard let index = lists.firstIndex(where: { $0.id == list.id }) else { return }
        let original = lists[index]
        apply(&lists[index])
        actionFailure = nil

        do {
            try await save()
        } catch {
            if let index = lists.firstIndex(where: { $0.id == list.id }) {
                lists[index] = original
            }
            actionFailure = error
        }
    }
}
