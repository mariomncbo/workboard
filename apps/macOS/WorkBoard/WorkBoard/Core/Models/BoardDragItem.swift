import CoreTransferable
import UniformTypeIdentifiers

/// What travels when a task or a list is dragged inside a board: only its identifier.
/// The type is private to WorkBoard, so nothing is dropped as text into other apps.
nonisolated enum BoardDragItem: Codable, Transferable {
    case task(UUID)
    case list(UUID)

    static var transferRepresentation: some TransferRepresentation {
        CodableRepresentation(contentType: .workBoardItem)
    }
}

extension UTType {
    /// Declared in Info.plist (`UTExportedTypeDeclarations`).
    nonisolated static let workBoardItem = UTType(exportedAs: "com.mariomncbo.workboard.item")
}
