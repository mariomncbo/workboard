import SwiftUI

/// A permanent deletion waiting for explicit confirmation.
/// Every deletion (account, board, list or task) goes through `.deletionConfirmation(_:)`.
struct DeletionRequest: Identifiable {
    let id = UUID()
    /// The question, naming the item: "¿Eliminar «Lanzamiento v2»?"
    let title: LocalizedStringKey
    /// What gets deleted and that it cannot be undone.
    let message: LocalizedStringKey
    /// Names the action: "Eliminar tablero". Never "Aceptar".
    let actionTitle: LocalizedStringKey
    /// When set, the user must type it (the nickname, to delete the account) to enable the button.
    var confirmationPhrase: String?
    /// Runs the deletion. A thrown error is shown in the dialog, which stays open.
    let action: () async throws -> Void
}
