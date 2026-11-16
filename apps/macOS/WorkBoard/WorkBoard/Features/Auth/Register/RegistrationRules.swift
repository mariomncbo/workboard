import Foundation

/// Validation of the sign-up form. Mirrors the database constraints, so most
/// problems are caught before sending anything.
nonisolated enum RegistrationRules {
    static let minimumPasswordLength = 8

    /// Lowercase, without spaces or a leading "@", as stored in the database.
    static func normalizedNickname(_ nickname: String) -> String {
        var normalized = nickname.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if normalized.hasPrefix("@") {
            normalized.removeFirst()
        }
        return normalized
    }

    static func fullNameIssue(_ fullName: String) -> LocalizedStringResource? {
        let trimmed = fullName.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return "Escribe tu nombre y apellidos."
        }
        if trimmed.count > 100 {
            return "Máximo 100 caracteres."
        }
        return nil
    }

    static func emailIssue(_ email: String) -> LocalizedStringResource? {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (try? #/^[^@\s]+@[^@\s]+\.[^@\s]+$/#.wholeMatch(in: trimmed)) != nil else {
            return "Escribe un correo válido, como nombre@ejemplo.com."
        }
        return nil
    }

    /// Checks an already normalized nickname: 3–30 characters, a–z, 0–9, "_" or ".".
    static func nicknameIssue(_ normalizedNickname: String) -> LocalizedStringResource? {
        guard (try? #/^[a-z0-9_.]{3,30}$/#.wholeMatch(in: normalizedNickname)) != nil else {
            return "Usa de 3 a 30 caracteres: letras sin tildes, números, «_» o «.»."
        }
        return nil
    }

    static func passwordIssue(_ password: String) -> LocalizedStringResource? {
        password.count < minimumPasswordLength ? "Mínimo 8 caracteres." : nil
    }
}
