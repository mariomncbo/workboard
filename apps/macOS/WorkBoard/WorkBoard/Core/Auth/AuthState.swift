/// Where the app is in the authentication flow.
enum AuthState: Equatable {
    /// Restoring the saved session at launch.
    case loading
    case signedOut
    case signedIn(Profile)
    /// Opened from a password reset link: the user must choose a new password.
    case choosingNewPassword
}
