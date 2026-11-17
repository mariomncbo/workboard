import Foundation
import Testing

/// Encodes a value and returns it as a JSON dictionary, to check what is sent to Supabase.
func jsonObject(_ value: some Encodable) throws -> [String: Any] {
    let data = try JSONEncoder().encode(value)
    return try #require(JSONSerialization.jsonObject(with: data) as? [String: Any])
}

/// Decodes a value from a JSON string, as Supabase would return it.
func decode<Value: Decodable>(_ type: Value.Type, from json: String) throws -> Value {
    try JSONDecoder().decode(type, from: Data(json.utf8))
}
