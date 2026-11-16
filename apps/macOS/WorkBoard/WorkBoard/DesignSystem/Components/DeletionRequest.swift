import Foundation

/// A permanent deletion waiting for explicit confirmation.
/// Every deletion (account, board, list or task) goes through `.deletionConfirmation(_:)`.
struct DeletionRequest {
    /// The question, naming the item: "¿Eliminar el tablero «Lanzamiento v2»?"
    let title: String
    /// What gets deleted and that it cannot be undone.
    let message: String
    /// Names the action: "Eliminar tablero". Never "Aceptar".
    let actionTitle: String
    let action: () -> Void
}
