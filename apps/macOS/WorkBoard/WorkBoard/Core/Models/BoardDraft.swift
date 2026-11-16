import Foundation

/// Editable fields of a board, used to create it or save its settings.
nonisolated struct BoardDraft: Encodable, Equatable, Sendable {
    static let maximumNameLength = 100
    static let maximumDescriptionLength = 2000

    var name = ""
    var description = ""
    var background = BoardBackground.dots
    var isFavorite = false

    init() {}

    init(board: Board) {
        name = board.name
        description = board.description ?? ""
        background = board.background
        isFavorite = board.isFavorite
    }

    var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var isValid: Bool {
        !trimmedName.isEmpty
            && trimmedName.count <= Self.maximumNameLength
            && description.count <= Self.maximumDescriptionLength
    }

    private enum CodingKeys: String, CodingKey {
        case name
        case description
        case background
        case isFavorite = "is_favorite"
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(trimmedName, forKey: .name)
        let trimmedDescription = description.trimmingCharacters(in: .whitespacesAndNewlines)
        // An empty description is stored as null.
        try container.encode(trimmedDescription.isEmpty ? nil : trimmedDescription, forKey: .description)
        try container.encode(background, forKey: .background)
        try container.encode(isFavorite, forKey: .isFavorite)
    }
}
