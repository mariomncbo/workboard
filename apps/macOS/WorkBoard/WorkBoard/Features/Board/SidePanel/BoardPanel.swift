import Foundation

/// Side panels of a board. Only one can be open at a time.
enum BoardPanel: String, Identifiable {
    case notes
    case planner

    var id: Self { self }

    static let width = 320.0

    var title: LocalizedStringResource {
        switch self {
        case .notes: "Notas"
        case .planner: "Planificador"
        }
    }

    var systemImage: String {
        switch self {
        case .notes: "note.text"
        case .planner: "calendar"
        }
    }
}
