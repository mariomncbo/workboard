import Foundation
import Supabase

/// Errors when reading or saving boards, lists and tasks.
enum DataFailure: LocalizedError, Equatable {
    case network
    case unexpected

    init(_ error: any Error) {
        self = error is URLError ? .network : .unexpected
    }

    var message: LocalizedStringResource {
        switch self {
        case .network: "No hay conexión. Comprueba tu red y vuelve a probar."
        case .unexpected: "No se han podido guardar los cambios. Vuelve a probar en unos segundos."
        }
    }

    var errorDescription: String? {
        String(localized: message)
    }
}
