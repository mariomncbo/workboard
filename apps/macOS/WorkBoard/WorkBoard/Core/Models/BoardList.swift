import Foundation

/// A list inside a board (`board_lists` table), with its number of tasks.
nonisolated struct BoardList: Codable, Equatable, Identifiable, Sendable {
    static let maximumNameLength = 100

    let id: UUID
    let boardID: UUID
    var name: String
    var style: BoardListStyle
    /// Fractional position: lists are sorted by it, and moving one only changes its own value.
    var position: Double
    var taskCount: Int

    init(id: UUID, boardID: UUID, name: String, style: BoardListStyle, position: Double, taskCount: Int = 0) {
        self.id = id
        self.boardID = boardID
        self.name = name
        self.style = style
        self.position = position
        self.taskCount = taskCount
    }

    private enum CodingKeys: String, CodingKey {
        case id
        case boardID = "board_id"
        case name
        case style
        case position
        case tasks = "board_tasks"
    }

    /// PostgREST returns the embedded count as `"board_tasks": [{ "count": 3 }]`.
    private struct TaskCount: Decodable {
        let count: Int
    }

    init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        boardID = try container.decode(UUID.self, forKey: .boardID)
        name = try container.decode(String.self, forKey: .name)
        style = try container.decode(BoardListStyle.self, forKey: .style)
        position = try container.decode(Double.self, forKey: .position)
        taskCount = try container.decodeIfPresent([TaskCount].self, forKey: .tasks)?.first?.count ?? 0
    }

    /// Encodes the list's own columns (not the task count), to restore it after an undo.
    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(boardID, forKey: .boardID)
        try container.encode(name, forKey: .name)
        try container.encode(style, forKey: .style)
        try container.encode(position, forKey: .position)
    }
}
