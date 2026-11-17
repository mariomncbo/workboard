import Foundation

/// Modals that can be open on Home.
enum HomeModal: Identifiable {
    case createBoard
    case boardSettings(Board)

    var id: String {
        switch self {
        case .createBoard: "create-board"
        case .boardSettings(let board): "board-settings-\(board.id)"
        }
    }
}
