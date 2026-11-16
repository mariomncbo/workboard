import Foundation

/// State and actions of the "Perfil" modal: change the name and the nickname.
@Observable
final class ProfileModel {
    var fullName: String
    var nickname: String

    private(set) var nicknameStatus = NicknameStatus.unchecked
    private(set) var failure: AuthFailure?
    private(set) var isSaving = false
    private(set) var hasAttemptedSave = false

    @ObservationIgnored private let original: Profile

    init(profile: Profile) {
        original = profile
        fullName = profile.fullName
        nickname = profile.nickname
    }

    var normalizedNickname: String {
        RegistrationRules.normalizedNickname(nickname)
    }

    var hasChanges: Bool {
        fullName.trimmingCharacters(in: .whitespacesAndNewlines) != original.fullName
            || normalizedNickname != original.nickname
    }

    var fullNameMessage: FieldMessage? {
        guard hasAttemptedSave, let issue = RegistrationRules.fullNameIssue(fullName) else { return nil }
        return .error(issue)
    }

    var nicknameMessage: FieldMessage {
        if nicknameStatus == .taken {
            return .error(AuthFailure.nicknameTaken.message)
        }
        if hasAttemptedSave, let issue = RegistrationRules.nicknameIssue(normalizedNickname) {
            return .error(issue)
        }
        return .help("Letras, números, «_» o «.». También te sirve para iniciar sesión.")
    }

    /// Checks a new nickname shortly after the user stops typing.
    func checkNickname(using auth: AuthService) async {
        let candidate = normalizedNickname
        guard candidate != original.nickname, RegistrationRules.nicknameIssue(candidate) == nil else {
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
            nicknameStatus = .unchecked
        }
    }

    /// - Returns: `true` when the profile was saved.
    func save(using auth: AuthService) async -> Bool {
        hasAttemptedSave = true
        failure = nil
        guard RegistrationRules.fullNameIssue(fullName) == nil,
              RegistrationRules.nicknameIssue(normalizedNickname) == nil,
              nicknameStatus != .taken,
              !isSaving else { return false }

        isSaving = true
        defer { isSaving = false }

        do {
            try await auth.updateProfile(
                fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines),
                nickname: normalizedNickname
            )
            return true
        } catch {
            if error == .nicknameTaken {
                nicknameStatus = .taken
            } else {
                failure = error
            }
            return false
        }
    }
}
