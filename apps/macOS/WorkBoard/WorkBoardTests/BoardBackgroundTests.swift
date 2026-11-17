import Testing
@testable import WorkBoard

@Suite("Fondo de tablero")
struct BoardBackgroundTests {
    private struct Wrapper: Codable {
        let background: BoardBackground
    }

    @Test("Se lee la cuadrícula de puntos y los colores de la paleta")
    func decodes() throws {
        #expect(try decode(Wrapper.self, from: #"{"background":"dots"}"#).background == .dots)
        #expect(try decode(Wrapper.self, from: #"{"background":"teal"}"#).background == .color(.teal))
    }

    @Test("Un valor desconocido vuelve al fondo por defecto")
    func unknownValueFallsBack() throws {
        #expect(try decode(Wrapper.self, from: #"{"background":"fucsia"}"#).background == .dots)
    }

    @Test("Se guarda con los mismos valores que la base de datos")
    func encodes() throws {
        #expect(try jsonObject(Wrapper(background: .dots))["background"] as? String == "dots")
        #expect(try jsonObject(Wrapper(background: .color(.graphite)))["background"] as? String == "graphite")
    }

    @Test("El selector ofrece los puntos y los 10 colores")
    func allOptions() {
        #expect(BoardBackground.allCases.count == 11)
        #expect(BoardBackground.allCases.first == .dots)
    }
}
