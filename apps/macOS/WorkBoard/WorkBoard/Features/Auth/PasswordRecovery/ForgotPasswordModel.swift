import Foundation

/// State and actions of the "Recuperar contraseña" sheet.
@Observable
final class ForgotPasswordModel {
    var email: String
    private(set) var failure: AuthFailure?
    private(set) var isSending = false
    private(set) var didSend = false

    init(email: String) {
        self.email = email
    }

    var canSend: Bool {
        RegistrationRules.emailIssue(email) == nil && !isSending
    }

    func send(using auth: AuthService) async {
        guard canSend else { return }
        isSending = true
        failure = nil
        defer { isSending = false }

        do {
            try await auth.sendPasswordReset(to: email.trimmingCharacters(in: .whitespacesAndNewlines))
            didSend = true
        } catch {
            failure = error
        }
    }
}
