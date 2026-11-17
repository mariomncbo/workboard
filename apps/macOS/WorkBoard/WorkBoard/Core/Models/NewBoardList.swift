import Foundation

/// Fields sent to create a list. The owner comes from the session.
nonisolated struct NewBoardList: Encodable, Sendable {
    let boardID: UUID
    let name: String
    let style: BoardListStyle
    let position: Double

    private enum CodingKeys: String, CodingKey {
        case boardID = "board_id"
        case name
        case style
        case position
    }
}
