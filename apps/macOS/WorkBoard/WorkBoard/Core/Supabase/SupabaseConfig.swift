import Foundation

/// Connection settings for the Supabase project, read from `Secrets.plist`.
///
/// `Secrets.plist` is not versioned. Copy `Secrets.example.plist` to
/// `WorkBoard/Config/Secrets.plist` and fill in your project's values.
nonisolated struct SupabaseConfig: Decodable, Sendable {
    let url: URL
    let publishableKey: String

    private enum CodingKeys: String, CodingKey {
        case url = "SupabaseURL"
        case publishableKey = "SupabasePublishableKey"
    }

    enum LoadError: LocalizedError {
        case missingFile
        case invalidFile(underlying: Error)

        var errorDescription: String? {
            switch self {
            case .missingFile:
                "Falta Secrets.plist. Cópialo desde Secrets.example.plist y añade las claves de Supabase."
            case .invalidFile(let underlying):
                "Secrets.plist no es válido: \(underlying.localizedDescription)"
            }
        }
    }

    /// Loads the configuration from the given bundle.
    static func load(from bundle: Bundle = .main) throws -> SupabaseConfig {
        guard let fileURL = bundle.url(forResource: "Secrets", withExtension: "plist") else {
            throw LoadError.missingFile
        }
        do {
            let data = try Data(contentsOf: fileURL)
            return try PropertyListDecoder().decode(SupabaseConfig.self, from: data)
        } catch {
            throw LoadError.invalidFile(underlying: error)
        }
    }
}
