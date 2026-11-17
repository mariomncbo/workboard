import SwiftUI

/// "Crear lista": name and style (white or black). The list goes at the end of the board.
struct CreateListModal: View {
    let onCreate: (String, BoardListStyle) async throws(DataFailure) -> Void
    let onClose: () -> Void

    @State private var name = ""
    @State private var style = BoardListStyle.light
    @State private var isSaving = false
    @State private var failure: DataFailure?
    @FocusState private var isNameFocused: Bool

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canCreate: Bool {
        !trimmedName.isEmpty && trimmedName.count <= BoardList.maximumNameLength && !isSaving
    }

    var body: some View {
        ModalCard(width: 400) {
            ModalHeader(title: "Crear lista")

            FormField(title: "Nombre", text: $name, prompt: "Por hacer", focus: $isNameFocused)

            VStack(alignment: .leading, spacing: Spacing.s2) {
                Text("Estilo")
                    .font(.callout.weight(.medium))
                    .foregroundStyle(Color.textSecondary)
                HStack(spacing: 10) {
                    ForEach(BoardListStyle.allCases) { option in
                        ListStyleOption(style: option, isSelected: style == option) {
                            style = option
                        }
                    }
                }
            }

            Text("La lista se añade al final del tablero. Puedes moverla después arrastrándola.")
                .font(.subheadline)
                .foregroundStyle(Color.textTertiary)

            if let failure {
                FieldMessageView(message: .error(failure.message))
            }

            HStack(spacing: Spacing.s2) {
                Spacer()
                Button("Cancelar", action: onClose)
                    .buttonStyle(.content(.secondary))
                    .keyboardShortcut(.cancelAction)
                Button("Crear lista", action: create)
                    .buttonStyle(.content(.primary))
                    .keyboardShortcut(.defaultAction)
                    .disabled(!canCreate)
            }
        }
        .defaultFocus($isNameFocused, true)
        .onSubmit(create)
    }

    private func create() {
        guard canCreate else { return }
        isSaving = true
        failure = nil
        Task {
            do {
                try await onCreate(trimmedName, style)
                onClose()
            } catch {
                failure = error as? DataFailure ?? .unexpected
                isSaving = false
            }
        }
    }
}
