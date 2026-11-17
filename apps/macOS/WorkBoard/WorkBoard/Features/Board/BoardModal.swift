import Foundation

/// Modals that can be open on a board.
enum BoardModal: Identifiable {
    case settings
    case createList
    case task(BoardTask)

    var id: String {
        switch self {
        case .settings: "settings"
        case .createList: "create-list"
        case .task(let task): "task-\(task.id)"
        }
    }
}
