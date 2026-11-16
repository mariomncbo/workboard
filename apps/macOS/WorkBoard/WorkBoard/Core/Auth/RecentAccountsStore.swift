import Foundation
import Supabase

/// The last accounts used on this Mac, most recent first, stored in the Keychain
/// (they include refresh tokens). Reuses the Keychain storage of the Supabase SDK.
@Observable
final class RecentAccountsStore {
    static let limit = 3

    private(set) var accounts: [RecentAccount] = []

    @ObservationIgnored private let storage: KeychainLocalStorage
    private static let storageKey = "recent-accounts"

    init(storage: KeychainLocalStorage = KeychainLocalStorage(service: "com.mariomncbo.WorkBoard.recent-accounts")) {
        self.storage = storage
        accounts = Self.load(from: storage)
    }

    /// Moves the account to the top of the list with a fresh session.
    func remember(_ profile: Profile, refreshToken: String) {
        accounts.removeAll { $0.id == profile.id }
        let account = RecentAccount(
            id: profile.id,
            fullName: profile.fullName,
            nickname: profile.nickname,
            refreshToken: refreshToken,
            lastUsedAt: .now
        )
        accounts.insert(account, at: 0)
        accounts = Array(accounts.prefix(Self.limit))
        save()
    }

    /// Keeps the stored session current when Supabase rotates the refresh token.
    func updateRefreshToken(_ refreshToken: String, for id: UUID) {
        guard let index = accounts.firstIndex(where: { $0.id == id }),
              accounts[index].refreshToken != refreshToken else { return }
        accounts[index].refreshToken = refreshToken
        save()
    }

    /// Updates the name and nickname shown for an account after editing the profile.
    func updateProfile(_ profile: Profile) {
        guard let index = accounts.firstIndex(where: { $0.id == profile.id }) else { return }
        accounts[index].fullName = profile.fullName
        accounts[index].nickname = profile.nickname
        save()
    }

    /// Keeps the account in the list, but it will ask for the password next time.
    func forgetSession(for id: UUID) {
        guard let index = accounts.firstIndex(where: { $0.id == id }) else { return }
        accounts[index].refreshToken = nil
        save()
    }

    /// Removes the account from this Mac.
    func remove(_ id: UUID) {
        accounts.removeAll { $0.id == id }
        save()
    }

    private func save() {
        do {
            let data = try JSONEncoder().encode(accounts)
            try storage.store(key: Self.storageKey, value: data)
        } catch {
            assertionFailure("Could not save recent accounts: \(error)")
        }
    }

    private static func load(from storage: KeychainLocalStorage) -> [RecentAccount] {
        guard let data = try? storage.retrieve(key: storageKey),
              let accounts = try? JSONDecoder().decode([RecentAccount].self, from: data) else {
            return []
        }
        return accounts
    }
}
