import SwiftUI

/// Text shown under a form field.
enum FieldMessage: Equatable {
    /// Neutral guidance, such as "Mínimo 8 caracteres."
    case help(LocalizedStringResource)
    /// What went wrong and how to fix it, such as "Ese nickname ya está en uso. Prueba con otro."
    case error(LocalizedStringResource)

    var isError: Bool {
        if case .error = self { true } else { false }
    }
}
