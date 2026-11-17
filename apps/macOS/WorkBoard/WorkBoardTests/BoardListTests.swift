import Foundation
import Testing
@testable import WorkBoard

@Suite("Listas")
struct BoardListTests {
    private let listID = UUID()
    private let boardID = UUID()

    @Test("Se lee el número de tareas que devuelve Supabase")
    func decodesTaskCount() throws {
        let json = """
        {"id":"\(listID)","board_id":"\(boardID)","name":"Por hacer","style":"dark","position":1.5,"board_tasks":[{"count":3}]}
        """
        let list = try decode(BoardList.self, from: json)
        #expect(list.name == "Por hacer")
        #expect(list.style == .dark)
        #expect(list.position == 1.5)
        #expect(list.taskCount == 3)
    }

    @Test("Sin el recuento, la lista tiene 0 tareas")
    func missingCountIsZero() throws {
        let json = """
        {"id":"\(listID)","board_id":"\(boardID)","name":"Hecho","style":"light","position":2}
        """
        #expect(try decode(BoardList.self, from: json).taskCount == 0)
    }

    @Test("Al restaurarla solo se envían sus columnas, no el recuento")
    func encodesOwnColumns() throws {
        let list = BoardList(id: listID, boardID: boardID, name: "Revisión", style: .light, position: 3, taskCount: 7)
        let json = try jsonObject(list)
        #expect(Set(json.keys) == ["id", "board_id", "name", "style", "position"])
        #expect(json["style"] as? String == "light")
    }
}
