import Foundation

/// State and actions of the Register screen.
@Observable
final class RegisterModel {
    var fullName = ""
    var email = ""
    var nickname = ""
    var password = ""
    var passwordConfirmation = ""

    private(set) var nicknameStatus = NicknameStatus.unchecked
    private(set) var failure: AuthFailure?
    private(set) var isSubmitting = false
    /// Field errors are shown after the first attempt, not while the user starts typing.
    private(set) var hasAttemptedSubmit = false

    var normalizedNickname: String {
        RegistrationRules.normalizedNickname(nickname)
    }

    // MARK: - Field messages

    var fullNameMessage: FieldMessage? {
        guard hasAttemptedSubmit, let issue = RegistrationRules.fullNameIssue(fullName) else { return nil }
        return .error(issue)
    }

    var emailMessage: FieldMessage? {
        guard hasAttemptedSubmit, let issue = RegistrationRules.emailIssue(email) else { return nil }
        return .error(issue)
    }

    var nicknameMessage: FieldMessage {
        if nicknameStatus == .taken {
            return .error(AuthFailure.nicknameTaken.message)
        }
        if hasAttemptedSubmit, let issue = RegistrationRules.nicknameIssue(normalizedNickname) {
            return .error(issue)
        }
        return .help("Letras, números, «_» o «.». También te servirá para iniciar sesión.")
    }

    var passwordMessage: FieldMessage {
        if hasAttemptedSubmit, let issue = RegistrationRules.passwordIssue(password) {
            return .error(issue)
        }
        return .help("Mínimo 8 caracteres.")
    }

    var passwordConfirmationMessage: FieldMessage? {
        let isFinishedTyping = hasAttemptedSubmit || passwordConfirmation.count >= password.count
        guard !passwordConfirmation.isEmpty || hasAttemptedSubmit,
              isFinishedTyping,
              passwordConfirmation != password else { return nil }
        return .error("Las contraseñas no coinciden.")
    }

    private var isValid: Bool {
        RegistrationRules.fullNameIssue(fullName) == nil
            && RegistrationRules.emailIssue(email) == nil
            && RegistrationRules.nicknameIssue(normalizedNickname) == nil
            && RegistrationRules.passwordIssue(password) == nil
            && password == passwordConfirmation
            && nicknameStatus != .taken
    }

    // MARK: - Actions

    /// Checks the nickname shortly after the user stops typing. Run it with
    /// `task(id: normalizedNickname)` so each new value cancels the previous check.
    func checkNickname(using auth: AuthService) async {
        let candidate = normalizedNickname
        guard RegistrationRules.nicknameIssue(candidate) == nil else {
            nicknameStatus = .unchecked
            return
        }

        nicknameStatus = .checking
        try? await Task.sleep(for: .milliseconds(400))
        guard !Task.isCancelled else { return }

        do {
            let isAvailable = try await auth.isNicknameAvailable(candidate)
            guard !Task.isCancelled else { return }
            nicknameStatus = isAvailable ? .available : .taken
        } catch {
            // The database checks it again on sign-up.
            nicknameStatus = .unchecked
        }
    }

    func signUp(using auth: AuthService) async {
        hasAttemptedSubmit = true
        failure = nil
        guard isValid, !isSubmitting else { return }

        isSubmitting = true
        defer { isSubmitting = false }

        do {
            try await auth.signUp(
                fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines),
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                nickname: normalizedNickname,
                password: password
            )
        } catch {
            if error == .nicknameTaken {
                nicknameStatus = .taken
            } else {
                failure = error
            }
        }
    }
}
