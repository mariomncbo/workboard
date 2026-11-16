import Foundation
import Supabase

/// Authentication errors, with messages that say what happened and how to fix it.
enum AuthFailure: LocalizedError, Equatable {
    case invalidCredentials
    case emailInUse
    case nicknameTaken
    case weakPassword
    case samePassword
    case rateLimited
    /// A recent account whose session is no longer valid.
    case sessionExpired
    /// A password reset link that expired, was already used or was opened on another Mac.
    case invalidResetLink
    case network
    case unexpected

    /// Maps errors from Supabase Auth, Edge Functions and the network.
    init(_ error: any Error) {
        if let failure = error as? AuthFailure {
            self = failure
        } else if let authError = error as? AuthError {
            self = Self(authErrorCode: authError.errorCode)
        } else if let functionsError = error as? FunctionsError,
                  case .httpError(let code, _) = functionsError {
            self = switch code {
            case 401: .invalidCredentials
            case 429: .rateLimited
            default: .unexpected
            }
        } else if error is URLError {
            self = .network
        } else {
            self = .unexpected
        }
    }

    private init(authErrorCode code: ErrorCode) {
        self = switch code {
        case .invalidCredentials: .invalidCredentials
        case .userAlreadyExists, .emailExists: .emailInUse
        case .weakPassword: .weakPassword
        case .samePassword: .samePassword
        case .overRequestRateLimit, .overEmailSendRateLimit: .rateLimited
        case .refreshTokenNotFound, .sessionNotFound: .sessionExpired
        default: .unexpected
        }
    }

    /// What happened and how to fix it, ready to show in the interface.
    var message: LocalizedStringResource {
        switch self {
        case .invalidCredentials: "Correo, nickname o contraseña incorrectos."
        case .emailInUse: "Ya hay una cuenta con ese correo. Inicia sesión o usa otro."
        case .nicknameTaken: "Ese nickname ya está en uso. Prueba con otro."
        case .weakPassword: "La contraseña es demasiado débil. Usa al menos 8 caracteres."
        case .samePassword: "La contraseña nueva tiene que ser distinta de la anterior."
        case .rateLimited: "Demasiados intentos. Espera unos minutos y vuelve a probar."
        case .sessionExpired: "La sesión de esta cuenta ha caducado. Escribe la contraseña para entrar."
        case .invalidResetLink: "El enlace ha caducado o ya se usó. Pide uno nuevo desde este Mac."
        case .network: "No hay conexión. Comprueba tu red y vuelve a probar."
        case .unexpected: "Algo ha fallado. Vuelve a probar en unos segundos."
        }
    }

    var errorDescription: String? {
        String(localized: message)
    }
}
