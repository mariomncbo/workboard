import Foundation
import Testing
@testable import WorkBoard

@Suite("Borrador de tarea")
struct TaskDraftTests {
    private func task(color: PaletteColor? = .pink, description: String? = "Detalle") -> BoardTask {
        BoardTask(id: UUID(), listID: UUID(), name: "Escribir el README", description: description, color: color, position: 1)
    }

    @Test("Se envían el nombre, la descripción y el color")
    func encodesFields() throws {
        let json = try jsonObject(TaskDraft(task: task()))
        #expect(json["name"] as? String == "Escribir el README")
        #expect(json["description"] as? String == "Detalle")
        #expect(json["color"] as? String == "pink")
    }

    @Test("Sin color y sin descripción se guardan como null")
    func nullsWhenEmpty() throws {
        var draft = TaskDraft(task: task(color: nil, description: nil))
        draft.description = "  "

        let json = try jsonObject(draft)
        #expect(json["color"] is NSNull)
        #expect(json["description"] is NSNull)
    }

    @Test("El nombre es obligatorio")
    func validation() {
        var draft = TaskDraft(task: task())
        #expect(draft.isValid)
        draft.name = "  "
        #expect(!draft.isValid)
    }
}
