import Foundation

/// State and actions of the "new password" screen opened from the reset email.
@Observable
final class NewPasswordModel {
    var password = ""
    var passwordConfirmation = ""
    private(set) var failure: AuthFailure?
    private(set) var isSaving = false
    private(set) var hasAttemptedSave = false

    var passwordMessage: FieldMessage {
        if hasAttemptedSave, let issue = RegistrationRules.passwordIssue(password) {
            return .error(issue)
        }
        return .help("Mínimo 8 caracteres.")
    }

    var passwordConfirmationMessage: FieldMessage? {
        guard hasAttemptedSave || passwordConfirmation.count >= password.count,
              !passwordConfirmation.isEmpty || hasAttemptedSave,
              passwordConfirmation != password else { return nil }
        return .error("Las contraseñas no coinciden.")
    }

    func save(using auth: AuthService) async {
        hasAttemptedSave = true
        failure = nil
        guard RegistrationRules.passwordIssue(password) == nil,
              password == passwordConfirmation,
              !isSaving else { return }

        isSaving = true
        defer { isSaving = false }

        do {
            try await auth.updatePassword(password)
        } catch {
            failure = error
        }
    }
}
