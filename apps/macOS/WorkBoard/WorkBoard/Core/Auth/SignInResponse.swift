import Foundation

/// Response of the `sign-in` Edge Function. Only the tokens are needed:
/// the app hands them to Supabase Auth, which loads the rest of the session.
nonisolated struct SignInResponse: Decodable, Sendable {
    nonisolated struct Tokens: Decodable, Sendable {
        let accessToken: String
        let refreshToken: String

        private enum CodingKeys: String, CodingKey {
            case accessToken = "access_token"
            case refreshToken = "refresh_token"
        }
    }

    let session: Tokens
}
