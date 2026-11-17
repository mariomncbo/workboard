import Foundation
import Testing
@testable import WorkBoard

@Suite("Borrador de tablero")
struct BoardDraftTests {
    @Test("Se envían el nombre recortado, el fondo y el favorito")
    func encodesFields() throws {
        var draft = BoardDraft()
        draft.name = "  Lanzamiento v2  "
        draft.description = "  Seguimiento de la versión 2  "
        draft.background = .color(.teal)
        draft.isFavorite = true

        let json = try jsonObject(draft)
        #expect(json["name"] as? String == "Lanzamiento v2")
        #expect(json["description"] as? String == "Seguimiento de la versión 2")
        #expect(json["background"] as? String == "teal")
        #expect(json["is_favorite"] as? Bool == true)
    }

    @Test("Una descripción vacía se guarda como null")
    func emptyDescriptionIsNull() throws {
        var draft = BoardDraft()
        draft.name = "Tablero"
        draft.description = "   "

        let json = try jsonObject(draft)
        #expect(json["description"] is NSNull)
        #expect(json["background"] as? String == "dots")
    }

    @Test("El nombre es obligatorio y tiene límite de longitud")
    func validation() {
        var draft = BoardDraft()
        #expect(!draft.isValid)
        draft.name = "   "
        #expect(!draft.isValid)
        draft.name = "Tablero"
        #expect(draft.isValid)
        draft.name = String(repeating: "a", count: BoardDraft.maximumNameLength + 1)
        #expect(!draft.isValid)
    }

    @Test("Se crea a partir de un tablero existente")
    func fromBoard() {
        let board = Board(
            id: UUID(),
            name: "Marketing",
            description: nil,
            background: .color(.amber),
            isFavorite: true,
            createdAt: .now
        )
        let draft = BoardDraft(board: board)
        #expect(draft.name == "Marketing")
        #expect(draft.description.isEmpty)
        #expect(draft.background == .color(.amber))
        #expect(draft.isFavorite)
    }
}
