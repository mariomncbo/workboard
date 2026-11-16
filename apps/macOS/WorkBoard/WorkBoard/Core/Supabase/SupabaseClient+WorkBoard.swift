import Foundation
import Supabase

extension SupabaseClient {
    /// Creates the client shared by the whole app.
    ///
    /// The session is stored in the Keychain (the SDK's default on macOS),
    /// so it survives app launches, and access tokens refresh automatically.
    static func workBoard(config: SupabaseConfig) -> SupabaseClient {
        SupabaseClient(
            supabaseURL: config.url,
            supabaseKey: config.publishableKey,
            options: SupabaseClientOptions(
                auth: .init(emitLocalSessionAsInitialSession: true)
            )
        )
    }
}
