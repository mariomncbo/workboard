import Foundation

/// Request body of the `sign-in` Edge Function.
nonisolated struct SignInRequest: Encodable, Sendable {
    let identifier: String
    let password: String
}
