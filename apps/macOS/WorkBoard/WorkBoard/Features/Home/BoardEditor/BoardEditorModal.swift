import SwiftUI

/// "Crear tablero" and "Configuración del tablero" modals.
struct BoardEditorModal: View {
    let mode: BoardEditorMode
    let onSave: (BoardDraft) async throws(DataFailure) -> Void
    /// Settings only: asks to confirm the deletion.
    var onDelete: (() -> Void)?
    let onClose: () -> Void

    @State private var draft: BoardDraft
    @State private var isSaving = false
    @State private var failure: DataFailure?
    @FocusState private var isNameFocused: Bool

    init(
        mode: BoardEditorMode,
        onSave: @escaping (BoardDraft) async throws(DataFailure) -> Void,
        onDelete: (() -> Void)? = nil,
        onClose: @escaping () -> Void
    ) {
        self.mode = mode
        self.onSave = onSave
        self.onDelete = onDelete
        self.onClose = onClose
        switch mode {
        case .create:
            _draft = State(initialValue: BoardDraft())
        case .settings(let board, _):
            _draft = State(initialValue: BoardDraft(board: board))
        }
    }

    var body: some View {
        ModalCard {
            switch mode {
            case .create:
                ModalHeader(title: "Crear tablero")

                HStack(alignment: .top, spacing: 16) {
                    BoardPreviewCard(draft: draft)
                        .frame(height: 96)

                    VStack(alignment: .leading, spacing: 14) {
                        FormField(title: "Nombre", text: $draft.name, prompt: "Lanzamiento v2", focus: $isNameFocused)
                        FavoriteToggleButton(isFavorite: $draft.isFavorite)
                    }
                }

                BoardBackgroundPicker(selection: $draft.background)

            case .settings(_, let summary):
                ModalHeader(title: "Configuración del tablero", onClose: onClose)

                FormField(title: "Nombre", text: $draft.name, focus: $isNameFocused)

                FormTextArea(
                    title: "Descripción",
                    note: "(opcional)",
                    text: $draft.description,
                    prompt: "¿De qué trata este tablero?"
                )

                BoardBackgroundPicker(selection: $draft.background)

                VStack(spacing: 0) {
                    Toggle(isOn: $draft.isFavorite) {
                        Label {
                            Text("Favorito")
                        } icon: {
                            Image(systemName: "star.fill")
                                .foregroundStyle(Color.favorite)
                        }
                    }
                    .toggleStyle(.switch)
                    .controlSize(.small)
                    .padding(.vertical, 10)

                    Divider()

                    LabeledContent("Contenido") {
                        BoardSummaryText(summary: summary)
                            .foregroundStyle(Color.textPrimary)
                    }
                    .foregroundStyle(Color.textSecondary)
                    .padding(.vertical, 10)

                    Divider()
                }
                .font(.body)
            }

            if let failure {
                FieldMessageView(message: .error(failure.message))
            }

            footer
        }
        .defaultFocus($isNameFocused, true)
        .onSubmit(save)
    }

    private var footer: some View {
        HStack(spacing: Spacing.s2) {
            if let onDelete {
                Button("Eliminar tablero…", systemImage: "trash", action: onDelete)
                    .buttonStyle(.content(.plain))
                    .foregroundStyle(Color.dangerText)
            }
            Spacer()
            Button("Cancelar", action: onClose)
                .buttonStyle(.content(.secondary))
                .keyboardShortcut(.cancelAction)
            Button(action: save) {
                Text(saveTitle)
                    .opacity(isSaving ? 0 : 1)
                    .overlay {
                        if isSaving {
                            ProgressView()
                                .controlSize(.small)
                                .tint(Color.onAccent)
                        }
                    }
            }
            .buttonStyle(.content(.primary))
            .keyboardShortcut(.defaultAction)
            .disabled(!draft.isValid || isSaving)
        }
        .padding(.top, Spacing.s1)
    }

    private var saveTitle: LocalizedStringKey {
        switch mode {
        case .create: "Crear tablero"
        case .settings: "Guardar"
        }
    }

    private func save() {
        guard draft.isValid, !isSaving else { return }
        isSaving = true
        failure = nil
        Task {
            do {
                try await onSave(draft)
                onClose()
            } catch {
                failure = error as? DataFailure ?? .unexpected
                isSaving = false
            }
        }
    }
}
