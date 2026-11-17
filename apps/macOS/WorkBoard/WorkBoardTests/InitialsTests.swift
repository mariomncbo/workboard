import Foundation
import Testing
@testable import WorkBoard

@Suite("Iniciales del avatar")
struct InitialsTests {
    private let spanish = Locale(identifier: "es_ES")

    @Test("Nombre y primer apellido", arguments: [
        ("Lucía Ortega", "LO"),
        ("Daniel Ruiz Gómez", "DR"),
        ("  lucía    ortega  ", "LO"),
        ("Óscar Ñúñez", "ÓÑ"),
    ])
    func firstNameAndSurname(fullName: String, expected: String) {
        #expect(Initials.from(fullName, locale: spanish) == expected)
    }

    @Test("Una sola palabra: sus dos primeras letras")
    func singleWord() {
        #expect(Initials.from("Marta", locale: spanish) == "MA")
        #expect(Initials.from("a", locale: spanish) == "A")
    }

    @Test("Sin nombre, sin iniciales")
    func emptyName() {
        #expect(Initials.from("", locale: spanish).isEmpty)
        #expect(Initials.from("   ", locale: spanish).isEmpty)
    }
}
