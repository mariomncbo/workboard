import Foundation

/// Where a task goes after a drag: its list and its position inside it.
nonisolated struct TaskPlacement: Encodable, Sendable {
    let listID: UUID
    let position: Double

    private enum CodingKeys: String, CodingKey {
        case listID = "list_id"
        case position
    }
}
