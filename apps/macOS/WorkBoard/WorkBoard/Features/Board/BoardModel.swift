import SwiftUI

/// An open board and its lists: loading, creating, renaming, restyling, reordering and
/// deleting lists, and editing the board itself.
@Observable
final class BoardModel {
    private(set) var board: Board
    private(set) var lists: [BoardList] = []
    private(set) var isLoading = false
    private(set) var loadFailure: DataFailure?
    /// A change that could not be saved; it was reverted.
    private(set) var actionFailure: DataFailure?

    @ObservationIgnored private let boardRepository: BoardRepository
    @ObservationIgnored private let listRepository: ListRepository

    init(board: Board, boardRepository: BoardRepository, listRepository: ListRepository) {
        self.board = board
        self.boardRepository = boardRepository
        self.listRepository = listRepository
    }

    var summary: BoardSummary {
        BoardSummary(
            boardID: board.id,
            listCount: lists.count,
            taskCount: lists.reduce(0) { $0 + $1.taskCount }
        )
    }

    // MARK: - Lists

    func load() async {
        isLoading = true
        loadFailure = nil
        defer { isLoading = false }

        do {
            lists = try await listRepository.fetchLists(of: board.id)
        } catch {
            loadFailure = error
        }
    }

    /// Adds a list at the end of the board.
    func createList(named name: String, style: BoardListStyle) async throws(DataFailure) {
        let position = (lists.last?.position ?? 0) + 1
        let list = try await listRepository.create(
            NewBoardList(boardID: board.id, name: name, style: style, position: position)
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

    /// Applies a drag reorder right away, then saves the new position of each moved list.
    /// A moved list gets a position between its new neighbors, so no other list changes.
    func reorder(_ difference: ReorderDifference<UUID, ReorderableSingleCollectionIdentifier>) {
        difference.apply(to: &lists)

        var changes: [(id: UUID, position: Double)] = []
        for movedID in difference.sources {
            guard let index = lists.firstIndex(where: { $0.id == movedID }) else { continue }
            let previous = index > 0 ? lists[index - 1].position : nil
            let next = index < lists.count - 1 ? lists[index + 1].position : nil
            let position = switch (previous, next) {
            case let (previous?, next?): (previous + next) / 2
            case let (previous?, nil): previous + 1
            case let (nil, next?): next - 1
            case (nil, nil): 1.0
            }
            lists[index].position = position
            changes.append((movedID, position))
        }

        Task {
            do {
                for change in changes {
                    try await listRepository.setPosition(change.position, of: change.id)
                }
            } catch {
                actionFailure = error as? DataFailure ?? .unexpected
                await load()
            }
        }
    }

    /// Deletes the list; the database deletes its tasks.
    func delete(_ list: BoardList) async throws(DataFailure) {
        try await listRepository.delete(list.id)
        lists.removeAll { $0.id == list.id }
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
