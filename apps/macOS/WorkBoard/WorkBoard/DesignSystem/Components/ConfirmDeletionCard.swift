import SwiftUI

/// Dialog shown before any permanent deletion. "Cancelar" answers Esc; the danger
/// button is never the default action, so Return does not delete.
struct ConfirmDeletionCard: View {
    let request: DeletionRequest
    let onFinish: () -> Void

    @State private var typedPhrase = ""
    @State private var isDeleting = false
    @State private var errorMessage: String?

    private var canDelete: Bool {
        guard !isDeleting else { return false }
        guard let phrase = request.confirmationPhrase else { return true }
        return typedPhrase.trimmingCharacters(in: .whitespaces) == phrase
    }

    var body: some View {
        ModalCard(width: 340) {
            VStack(alignment: .leading, spacing: 10) {
                Image(systemName: "trash")
                    .font(.body.weight(.medium))
                    .foregroundStyle(Color.dangerText)
                    .frame(width: 32, height: 32)
                    .background(Color.dangerSubtle, in: .rect(cornerRadius: 8))
                    .accessibilityHidden(true)

                Text(request.title)
                    .font(.modalTitle)
                    .foregroundStyle(Color.textPrimary)
                    .accessibilityAddTraits(.isHeader)

                Text(request.message)
                    .font(.callout)
                    .foregroundStyle(Color.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if let phrase = request.confirmationPhrase {
                FormField(title: "Escribe \(phrase) para confirmar", text: $typedPhrase, prompt: LocalizedStringKey(phrase))
            }

            if let errorMessage {
                FieldMessageView(message: .error(LocalizedStringResource(stringLiteral: errorMessage)))
            }

            HStack(spacing: Spacing.s2) {
                Spacer()
                Button("Cancelar", action: onFinish)
                    .buttonStyle(.content(.secondary))
                    .keyboardShortcut(.cancelAction)
                Button(role: .destructive, action: delete) {
                    Text(request.actionTitle)
                        .opacity(isDeleting ? 0 : 1)
                        .overlay {
                            if isDeleting {
                                ProgressView()
                                    .controlSize(.small)
                                    .tint(Color.onDanger)
                            }
                        }
                }
                .buttonStyle(.content(.danger))
                .disabled(!canDelete)
            }
            .padding(.top, 2)
        }
    }

    private func delete() {
        isDeleting = true
        errorMessage = nil
        Task {
            do {
                try await request.action()
                onFinish()
            } catch {
                errorMessage = error.localizedDescription
                isDeleting = false
            }
        }
    }
}
