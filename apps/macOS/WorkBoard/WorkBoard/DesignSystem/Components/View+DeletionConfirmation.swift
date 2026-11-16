import SwiftUI

extension View {
    /// Asks for confirmation before a permanent deletion, using the system dialog.
    ///
    /// "Cancelar" responds to Esc and the destructive button is never the default
    /// action, so Return does not delete. Setting the request to `nil` dismisses it.
    func deletionConfirmation(_ request: Binding<DeletionRequest?>) -> some View {
        confirmationDialog(
            request.wrappedValue?.title ?? "",
            isPresented: Binding(
                get: { request.wrappedValue != nil },
                set: { isPresented in
                    if !isPresented {
                        request.wrappedValue = nil
                    }
                }
            ),
            presenting: request.wrappedValue
        ) { pending in
            Button(pending.actionTitle, role: .destructive, action: pending.action)
            Button("Cancelar", role: .cancel) {}
        } message: { pending in
            Text(pending.message)
        }
    }
}
