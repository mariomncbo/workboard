import Foundation

/// Number of lists and tasks of a board (`board_summaries` view).
nonisolated struct BoardSummary: Codable, Equatable, Sendable {
    let boardID: UUID
    let listCount: Int
    let taskCount: Int

    static func empty(for boardID: UUID) -> BoardSummary {
        BoardSummary(boardID: boardID, listCount: 0, taskCount: 0)
    }

    private enum CodingKeys: String, CodingKey {
        case boardID = "board_id"
        case listCount = "list_count"
        case taskCount = "task_count"
    }
}
