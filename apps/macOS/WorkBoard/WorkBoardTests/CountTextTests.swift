import Foundation
import Testing
@testable import WorkBoard

@Suite("Números con su sustantivo")
struct CountTextTests {
    private let spanish = Locale(identifier: "es_ES")

    @Test("Singular solo con uno", arguments: [
        (0, "0 tareas"),
        (1, "1 tarea"),
        (2, "2 tareas"),
        (18, "18 tareas"),
    ])
    func tasks(count: Int, expected: String) {
        #expect(CountText.tasks(count, locale: spanish) == expected)
    }

    @Test("Listas y tableros")
    func listsAndBoards() {
        #expect(CountText.lists(1, locale: spanish) == "1 lista")
        #expect(CountText.lists(4, locale: spanish) == "4 listas")
        #expect(CountText.boards(1, locale: spanish) == "1 tablero")
        #expect(CountText.boards(6, locale: spanish) == "6 tableros")
    }

    @Test("Separador de miles del idioma")
    func thousands() {
        #expect(CountText.tasks(12_000, locale: spanish) == "12.000 tareas")
    }

    @Test("Mensajes de borrado, como en la web")
    func possessive() {
        #expect(CountText.theirLists(1, locale: spanish) == "su lista")
        #expect(CountText.theirLists(3, locale: spanish) == "sus 3 listas")
        #expect(CountText.theirTasks(1, locale: spanish) == "su tarea")
        #expect(CountText.theirTasks(0, locale: spanish) == "sus 0 tareas")
    }
}
