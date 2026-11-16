import Foundation

/// Avatar initials from a full name: first letter of the first name and of the first
/// surname; with a single word, its first two letters.
/// "Lucía Ortega" → "LO", "Daniel Ruiz Gómez" → "DR", "Marta" → "MA".
nonisolated enum Initials {
    static func from(_ fullName: String, locale: Locale = .current) -> String {
        let words = fullName.split(whereSeparator: \.isWhitespace)

        let initials = switch words.count {
        case 0: ""
        case 1: String(words[0].prefix(2))
        default: String(words[0].prefix(1)) + String(words[1].prefix(1))
        }

        return initials.uppercased(with: locale)
    }
}
