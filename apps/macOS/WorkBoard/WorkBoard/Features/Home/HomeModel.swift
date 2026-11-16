import Foundation

/// Boards of the signed-in user for the Home screen: loading, search, sorting and changes.
@Observable
final class HomeModel {
    private(set) var boards: [Board] = []
    private(set) var summaries: [UUID: BoardSummary] = [:]
    private(set) var isLoading = false
    private(set) var loadFailure: DataFailure?
    /// A favorite change that could not be saved, shown above the grid.
    private(set) var actionFailure: DataFailure?
    var searchText = ""

    @ObservationIgnored private let repository: BoardRepository

    init(repository: BoardRepository) {
        self.repository = repository
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
            async let boards = repository.fetchBoards()
            async let summaries = repository.fetchSummaries()
            self.boards = try await boards
            self.summaries = try await summaries
        } catch {
            loadFailure = error as? DataFailure ?? .unexpected
        }
    }

    func create(_ draft: BoardDraft) async throws(DataFailure) {
        let board = try await repository.create(draft)
        boards.append(board)
    }

    func update(_ board: Board, with draft: BoardDraft) async throws(DataFailure) {
        let updated = try await repository.update(board.id, with: draft)
        replace(updated)
    }

    /// Changes the star right away and reverts it if it cannot be saved.
    func toggleFavorite(_ board: Board) async {
        var changed = board
        changed.isFavorite.toggle()
        replace(changed)
        actionFailure = nil

        do {
            try await repository.setFavorite(changed.isFavorite, for: board.id)
        } catch {
            replace(board)
            actionFailure = error
        }
    }

    func delete(_ board: Board) async throws(DataFailure) {
        try await repository.delete(board.id)
        boards.removeAll { $0.id == board.id }
        summaries[board.id] = nil
    }

    func dismissActionFailure() {
        actionFailure = nil
    }

    private func replace(_ board: Board) {
        guard let index = boards.firstIndex(where: { $0.id == board.id }) else { return }
        boards[index] = board
    }
}
