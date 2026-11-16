import Foundation

/// A board of the signed-in user (`boards` table).
nonisolated struct Board: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    var name: String
    var description: String?
    var background: BoardBackground
    /// Only used for sorting: favorites come first.
    var isFavorite: Bool
    let createdAt: Date

    private enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case background
        case isFavorite = "is_favorite"
        case createdAt = "created_at"
    }
}
