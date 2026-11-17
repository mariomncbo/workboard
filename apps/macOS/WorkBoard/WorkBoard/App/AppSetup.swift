import Foundation
import Supabase

/// Builds the app's services at launch. If `Secrets.plist` is missing or invalid,
/// the app shows what to fix instead of crashing.
enum AppSetup {
    case ready(auth: AuthService, boards: BoardRepository, lists: ListRepository)
    case misconfigured(message: String)

    static func make() -> AppSetup {
        do {
            let config = try SupabaseConfig.load()
            let client = SupabaseClient.workBoard(config: config)
            return .ready(
                auth: AuthService(client: client),
                boards: BoardRepository(client: client),
                lists: ListRepository(client: client)
            )
        } catch {
            return .misconfigured(message: error.localizedDescription)
        }
    }
}
