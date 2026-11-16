import SwiftUI

extension View {
    /// Asks for confirmation before a permanent deletion, with the design system dialog.
    /// Apply it outside other `.modal(item:)` modifiers so it can appear on top of them.
    /// The request is cleared when the deletion finishes or is cancelled.
    func deletionConfirmation(_ request: Binding<DeletionRequest?>) -> some View {
        modal(item: request) { pending in
            ConfirmDeletionCard(request: pending) {
                request.wrappedValue = nil
            }
        }
    }
}
