import Foundation
import Supabase

/// Builds the app's services at launch. If `Secrets.plist` is missing or invalid,
/// the app shows what to fix instead of crashing.
enum AppSetup {
    case ready(AuthService)
    case misconfigured(message: String)

    static func make() -> AppSetup {
        do {
            let config = try SupabaseConfig.load()
            return .ready(AuthService(client: .workBoard(config: config)))
        } catch {
            return .misconfigured(message: error.localizedDescription)
        }
    }
}
