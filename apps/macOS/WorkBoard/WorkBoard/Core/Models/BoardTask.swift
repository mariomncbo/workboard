import Foundation

/// A task inside a list (`board_tasks` table).
nonisolated struct BoardTask: Codable, Equatable, Identifiable, Sendable {
    static let maximumNameLength = 500
    static let maximumDescriptionLength = 10000

    let id: UUID
    var listID: UUID
    var name: String
    var description: String?
    /// `nil` means no color: the task takes the field color of its list.
    var color: PaletteColor?
    /// Fractional position inside its list.
    var position: Double

    private enum CodingKeys: String, CodingKey {
        case id
        case listID = "list_id"
        case name
        case description
        case color
        case position
    }
}
