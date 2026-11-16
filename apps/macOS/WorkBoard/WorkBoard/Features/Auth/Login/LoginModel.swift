import Foundation

/// State and actions of the Login screen.
@Observable
final class LoginModel {
    var identifier = ""
    var password = ""
    private(set) var failure: AuthFailure?
    private(set) var isSubmitting = false
    /// Recent account being opened, to show its spinner.
    private(set) var openingAccountID: UUID?

    var canSubmit: Bool {
        !identifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !password.isEmpty && !isSubmitting
    }

    func signIn(using auth: AuthService) async {
        guard canSubmit else { return }
        isSubmitting = true
        failure = nil
        defer { isSubmitting = false }

        do {
            try await auth.signIn(identifier: identifier, password: password)
        } catch {
            failure = error
            password = ""
        }
    }

    /// Opens a recent account without a password when its session is still valid.
    /// - Returns: `true` when the account needs the password; the nickname is then filled in.
    func open(_ account: RecentAccount, using auth: AuthService) async -> Bool {
        guard openingAccountID == nil, !isSubmitting else { return false }
        failure = nil

        guard !account.requiresPassword else {
            prefill(account)
            return true
        }

        openingAccountID = account.id
        defer { openingAccountID = nil }

        do {
            try await auth.continueAs(account)
            return false
        } catch {
            failure = error
            if error == .sessionExpired {
                prefill(account)
                return true
            }
            return false
        }
    }

    private func prefill(_ account: RecentAccount) {
        identifier = "@" + account.nickname
        password = ""
    }
}
