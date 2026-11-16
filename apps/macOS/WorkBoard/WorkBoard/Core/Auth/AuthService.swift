import Foundation
import Supabase

/// Owns the user's session: sign-in with email or nickname, sign-up, recent accounts,
/// sign-out and password recovery. Views read `state` to decide what to show.
@Observable
final class AuthService {
    private(set) var state = AuthState.loading
    /// Login is shown on top of the current session to pick another account.
    private(set) var isSwitchingAccount = false
    /// A message for the Login screen that is not tied to a form, such as an expired reset link.
    private(set) var notice: AuthFailure?

    let recentAccounts: RecentAccountsStore

    @ObservationIgnored private let client: SupabaseClient

    init(client: SupabaseClient, recentAccounts: RecentAccountsStore = RecentAccountsStore()) {
        self.client = client
        self.recentAccounts = recentAccounts
    }

    var currentProfile: Profile? {
        if case .signedIn(let profile) = state { profile } else { nil }
    }

    /// Email of the signed-in user, shown only to that user (user menu).
    var currentEmail: String? {
        client.auth.currentUser?.email
    }

    // MARK: - Session lifecycle

    /// Restores the saved session and keeps recent accounts up to date while the app runs.
    /// Call once from the root view's `task`.
    func observeSession() async {
        for await (event, session) in client.auth.authStateChanges {
            switch event {
            case .initialSession:
                await restore(session)
            case .tokenRefreshed:
                if let session {
                    recentAccounts.updateRefreshToken(session.refreshToken, for: session.user.id)
                }
            case .signedOut:
                if case .signedIn = state {
                    state = .signedOut
                }
            default:
                break
            }
        }
    }

    private func restore(_ session: Session?) async {
        guard session != nil else {
            state = .signedOut
            return
        }
        do {
            // Returns a valid session, refreshing it first if it expired.
            let validSession = try await client.auth.session
            try await finishSignIn(with: validSession)
        } catch {
            state = .signedOut
        }
    }

    // MARK: - Sign in and sign up

    /// Signs in with an email or a nickname ("lortega" or "@lortega").
    func signIn(identifier: String, password: String) async throws(AuthFailure) {
        var identifier = identifier.trimmingCharacters(in: .whitespacesAndNewlines)
        if identifier.hasPrefix("@") {
            identifier.removeFirst()
        }

        do {
            let session: Session
            if identifier.contains("@") {
                session = try await client.auth.signIn(email: identifier, password: password)
            } else {
                // The nickname is resolved to its email on the server; the email never reaches the app.
                let response: SignInResponse = try await client.functions.invoke(
                    "sign-in",
                    options: FunctionInvokeOptions(body: SignInRequest(identifier: identifier, password: password))
                )
                session = try await client.auth.setSession(
                    accessToken: response.session.accessToken,
                    refreshToken: response.session.refreshToken
                )
            }
            try await finishSignIn(with: session)
        } catch {
            throw AuthFailure(error)
        }
    }

    func signUp(fullName: String, email: String, nickname: String, password: String) async throws(AuthFailure) {
        do {
            let response = try await client.auth.signUp(
                email: email,
                password: password,
                data: ["full_name": .string(fullName), "nickname": .string(nickname)]
            )
            // Email confirmation is off, so sign-up returns a session right away.
            guard let session = response.session else {
                throw AuthFailure.unexpected
            }
            try await finishSignIn(with: session)
        } catch let error as AuthError where error.errorCode == .unexpectedFailure {
            // The database rejects the sign-up when the nickname was taken in the meantime.
            throw .nicknameTaken
        } catch {
            throw AuthFailure(error)
        }
    }

    func isNicknameAvailable(_ nickname: String) async throws(AuthFailure) -> Bool {
        do {
            return try await client
                .rpc("is_nickname_available", params: ["candidate": nickname])
                .execute()
                .value
        } catch {
            throw AuthFailure(error)
        }
    }

    // MARK: - Recent accounts

    /// Enters a recent account without a password. If its session is no longer valid,
    /// the account is kept but marked as needing the password, and `.sessionExpired` is thrown.
    func continueAs(_ account: RecentAccount) async throws(AuthFailure) {
        if currentProfile?.id == account.id {
            isSwitchingAccount = false
            return
        }
        guard let refreshToken = account.refreshToken else {
            throw .sessionExpired
        }

        do {
            let session = try await client.auth.refreshSession(refreshToken: refreshToken)
            try await finishSignIn(with: session)
        } catch {
            let failure = AuthFailure(error)
            if failure == .network {
                throw failure
            }
            recentAccounts.forgetSession(for: account.id)
            throw .sessionExpired
        }
    }

    /// Shows Login over the current session to pick or add another account.
    func beginAccountSwitch() {
        isSwitchingAccount = true
    }

    func cancelAccountSwitch() {
        isSwitchingAccount = false
    }

    /// From the user menu: opens another recent account, or shows Login when it needs the password.
    func switchTo(_ account: RecentAccount) async {
        do {
            try await continueAs(account)
        } catch {
            beginAccountSwitch()
        }
    }

    // MARK: - Profile and account

    func updateProfile(fullName: String, nickname: String) async throws(AuthFailure) {
        guard let current = currentProfile else { throw .sessionExpired }
        do {
            let profile: Profile = try await client
                .from("profiles")
                .update(["full_name": fullName, "nickname": nickname])
                .eq("id", value: current.id.uuidString)
                .select("id, full_name, nickname")
                .single()
                .execute()
                .value
            recentAccounts.updateProfile(profile)
            state = .signedIn(profile)
        } catch let error as PostgrestError where error.code == "23505" {
            // Unique violation: someone else took the nickname.
            throw .nicknameTaken
        } catch {
            throw AuthFailure(error)
        }
    }

    /// Permanently deletes the account and all its data, through the `delete-account`
    /// Edge Function. The app asks for explicit confirmation first.
    func deleteAccount() async throws(AuthFailure) {
        guard let profile = currentProfile else { throw .sessionExpired }
        do {
            try await client.functions.invoke("delete-account", options: FunctionInvokeOptions(method: .post))
        } catch {
            throw AuthFailure(error)
        }
        recentAccounts.remove(profile.id)
        // The server already revoked the sessions; this clears the local copy.
        try? await client.auth.signOut(scope: .local)
        isSwitchingAccount = false
        state = .signedOut
    }

    // MARK: - Sign out

    /// Ends the session on the server. The account stays in recent accounts, but will
    /// ask for the password next time.
    func signOut() async {
        guard let profile = currentProfile else { return }
        recentAccounts.forgetSession(for: profile.id)
        try? await client.auth.signOut(scope: .local)
        isSwitchingAccount = false
        state = .signedOut
    }

    // MARK: - Password recovery

    /// Emails a link that opens the app to choose a new password.
    /// Supabase answers the same whether or not the email has an account.
    func sendPasswordReset(to email: String) async throws(AuthFailure) {
        do {
            try await client.auth.resetPasswordForEmail(email, redirectTo: AppLinks.passwordReset)
        } catch {
            throw AuthFailure(error)
        }
    }

    /// Handles `workboard://reset-password?code=…` from the reset email.
    func handleOpenURL(_ url: URL) async {
        guard url.scheme == AppLinks.passwordReset.scheme, url.host() == AppLinks.passwordReset.host() else {
            return
        }
        do {
            _ = try await client.auth.session(from: url)
            isSwitchingAccount = false
            notice = nil
            state = .choosingNewPassword
        } catch {
            notice = .invalidResetLink
        }
    }

    func updatePassword(_ newPassword: String) async throws(AuthFailure) {
        do {
            try await client.auth.update(user: UserAttributes(password: newPassword))
            let session = try await client.auth.session
            try await finishSignIn(with: session)
        } catch {
            throw AuthFailure(error)
        }
    }

    /// Leaves the new-password screen without changing the password.
    func cancelPasswordRecovery() async {
        try? await client.auth.signOut(scope: .local)
        state = .signedOut
    }

    func dismissNotice() {
        notice = nil
    }

    // MARK: - Helpers

    private func finishSignIn(with session: Session) async throws {
        let profile: Profile = try await client
            .from("profiles")
            .select("id, full_name, nickname")
            .eq("id", value: session.user.id.uuidString)
            .single()
            .execute()
            .value

        recentAccounts.remember(profile, refreshToken: session.refreshToken)
        isSwitchingAccount = false
        notice = nil
        state = .signedIn(profile)
    }
}
