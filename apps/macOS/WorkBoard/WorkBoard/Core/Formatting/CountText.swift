import Foundation

/// A number followed by its noun in singular or plural: "1 lista", "4 listas", "1.200 tareas".
///
/// The interface is only in Spanish and the app has no string catalog, so SwiftUI's automatic
/// grammar agreement (`inflect: true`) does not apply: the plural is written explicitly.
enum CountText {
    static func lists(_ count: Int, locale: Locale = .current) -> String {
        counted(count, singular: "lista", plural: "listas", locale: locale)
    }

    static func tasks(_ count: Int, locale: Locale = .current) -> String {
        counted(count, singular: "tarea", plural: "tareas", locale: locale)
    }

    static func boards(_ count: Int, locale: Locale = .current) -> String {
        counted(count, singular: "tablero", plural: "tableros", locale: locale)
    }

    /// For deletion messages: "su lista" or "sus 4 listas".
    static func theirLists(_ count: Int, locale: Locale = .current) -> String {
        count == 1 ? "su lista" : "sus \(lists(count, locale: locale))"
    }

    /// For deletion messages: "su tarea" or "sus 12 tareas".
    static func theirTasks(_ count: Int, locale: Locale = .current) -> String {
        count == 1 ? "su tarea" : "sus \(tasks(count, locale: locale))"
    }

    static func counted(_ count: Int, singular: String, plural: String, locale: Locale = .current) -> String {
        "\(count.formatted(.number.locale(locale))) \(count == 1 ? singular : plural)"
    }
}
