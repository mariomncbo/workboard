import Foundation

/// Editable fields of a task, saved from the task modal.
nonisolated struct TaskDraft: Encodable, Equatable, Sendable {
    var name: String
    var description: String
    var color: PaletteColor?

    init(task: BoardTask) {
        name = task.name
        description = task.description ?? ""
        color = task.color
    }

    var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var isValid: Bool {
        !trimmedName.isEmpty
            && trimmedName.count <= BoardTask.maximumNameLength
            && description.count <= BoardTask.maximumDescriptionLength
    }

    private enum CodingKeys: String, CodingKey {
        case name
        case description
        case color
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(trimmedName, forKey: .name)
        let trimmedDescription = description.trimmingCharacters(in: .whitespacesAndNewlines)
        // Empty description and "no color" are stored as null.
        try container.encode(trimmedDescription.isEmpty ? nil : trimmedDescription, forKey: .description)
        try container.encode(color, forKey: .color)
    }
}
