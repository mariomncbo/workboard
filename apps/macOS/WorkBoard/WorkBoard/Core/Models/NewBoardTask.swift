import Foundation

/// Fields sent to create a task. The owner comes from the session.
nonisolated struct NewBoardTask: Encodable, Sendable {
    let listID: UUID
    let name: String
    let position: Double

    private enum CodingKeys: String, CodingKey {
        case listID = "list_id"
        case name
        case position
    }
}
