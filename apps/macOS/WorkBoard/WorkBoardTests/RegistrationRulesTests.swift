import Testing
@testable import WorkBoard

@Suite("Reglas del registro")
struct RegistrationRulesTests {
    @Test("El nickname se guarda en minúsculas, sin espacios ni «@»")
    func normalizesNickname() {
        #expect(RegistrationRules.normalizedNickname("  @LOrtega ") == "lortega")
        #expect(RegistrationRules.normalizedNickname("Daniel.Ruiz_2") == "daniel.ruiz_2")
    }

    @Test("Nicknames válidos", arguments: ["abc", "lortega", "daniel.ruiz_2", String(repeating: "a", count: 30)])
    func validNicknames(nickname: String) {
        #expect(RegistrationRules.nicknameIssue(nickname) == nil)
    }

    @Test("Nicknames no válidos", arguments: ["", "ab", "con espacio", "lucía", "guion-medio", "@arroba", String(repeating: "a", count: 31)])
    func invalidNicknames(nickname: String) {
        #expect(RegistrationRules.nicknameIssue(nickname) != nil)
    }

    @Test("Correos válidos", arguments: ["lucia@ejemplo.com", "  a.b+c@dominio.es  "])
    func validEmails(email: String) {
        #expect(RegistrationRules.emailIssue(email) == nil)
    }

    @Test("Correos no válidos", arguments: ["", "lucia", "lucia@", "lucia@ejemplo", "@ejemplo.com", "lu cia@ejemplo.com"])
    func invalidEmails(email: String) {
        #expect(RegistrationRules.emailIssue(email) != nil)
    }

    @Test("La contraseña necesita al menos 8 caracteres")
    func passwordLength() {
        #expect(RegistrationRules.passwordIssue("1234567") != nil)
        #expect(RegistrationRules.passwordIssue("12345678") == nil)
    }

    @Test("El nombre no puede estar vacío ni pasar de 100 caracteres")
    func fullName() {
        #expect(RegistrationRules.fullNameIssue("   ") != nil)
        #expect(RegistrationRules.fullNameIssue("Lucía Ortega") == nil)
        #expect(RegistrationRules.fullNameIssue(String(repeating: "a", count: 101)) != nil)
    }
}
