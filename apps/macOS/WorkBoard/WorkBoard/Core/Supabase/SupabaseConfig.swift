import Foundation

/// Connection settings for the Supabase project, read from `Secrets.plist`.
///
/// `Secrets.plist` is not versioned. Copy `Secrets.example.plist` to
/// `WorkBoard/Config/Secrets.plist` and fill in your project's values.
nonisolated struct SupabaseConfig: Sendable {
    let url: URL
    let publishableKey: String

    private static let urlKey = "SupabaseURL"
    private static let publishableKeyKey = "SupabasePublishableKey"

    enum LoadError: LocalizedError {
        case missingFile
        case unreadableFile
        case missingValue(key: String)
        case invalidURL

        var errorDescription: String? {
            switch self {
            case .missingFile:
                "Falta Secrets.plist. Cópialo desde Secrets.example.plist y añade las claves de Supabase."
            case .unreadableFile:
                "Secrets.plist no se puede leer. Comprueba que es un archivo .plist válido."
            case .missingValue(let key):
                "Falta el valor «\(key)» en Secrets.plist."
            case .invalidURL:
                "La URL de Secrets.plist no es válida. Debe ser como https://<project-ref>.supabase.co."
            }
        }
    }

    /// Loads the configuration from the given bundle.
    static func load(from bundle: Bundle = .main) throws -> SupabaseConfig {
        guard let fileURL = bundle.url(forResource: "Secrets", withExtension: "plist") else {
            throw LoadError.missingFile
        }
        guard let data = try? Data(contentsOf: fileURL),
              let values = try? PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any] else {
            throw LoadError.unreadableFile
        }

        // The plist stores plain strings, so the URL is parsed by hand instead of with `Decodable`.
        let urlString = try requiredString(urlKey, in: values)
        let publishableKey = try requiredString(publishableKeyKey, in: values)

        guard let url = URL(string: urlString), url.scheme == "https", url.host() != nil else {
            throw LoadError.invalidURL
        }
        return SupabaseConfig(url: url, publishableKey: publishableKey)
    }

    private static func requiredString(_ key: String, in values: [String: Any]) throws -> String {
        guard let value = (values[key] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty else {
            throw LoadError.missingValue(key: key)
        }
        return value
    }
}
