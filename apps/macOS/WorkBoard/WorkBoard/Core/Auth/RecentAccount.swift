import Foundation

/// An account used on this Mac, shown under "Cuentas recientes" on Login.
nonisolated struct RecentAccount: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    var fullName: String
    var nickname: String
    /// Lets the user continue without a password. `nil` after signing out or when the
    /// session expired: the account stays in the list but asks for the password.
    var refreshToken: String?
    var lastUsedAt: Date

    var requiresPassword: Bool {
        refreshToken == nil
    }
}
