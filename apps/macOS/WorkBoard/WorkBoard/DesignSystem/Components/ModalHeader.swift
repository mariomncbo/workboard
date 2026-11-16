import SwiftUI

/// Title row of a modal, with an optional close button on the right.
struct ModalHeader: View {
    let title: LocalizedStringKey
    var onClose: (() -> Void)?

    var body: some View {
        HStack {
            Text(title)
                .font(.modalTitle)
                .foregroundStyle(Color.textPrimary)
                .accessibilityAddTraits(.isHeader)
            Spacer()
            if let onClose {
                IconButton(title: "Cerrar", systemImage: "xmark", action: onClose)
            }
        }
    }
}
