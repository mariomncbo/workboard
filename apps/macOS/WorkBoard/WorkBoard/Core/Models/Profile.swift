import Foundation

/// Public profile of an account (`profiles` table). The email is never part of it.
nonisolated struct Profile: Codable, Equatable, Identifiable, Sendable {
    let id: UUID
    var fullName: String
    var nickname: String

    private enum CodingKeys: String, CodingKey {
        case id
        case fullName = "full_name"
        case nickname
    }
}
