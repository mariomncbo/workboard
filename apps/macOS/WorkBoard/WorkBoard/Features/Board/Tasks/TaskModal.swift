import SwiftUI

/// The task modal: name, description, color and delete.
struct TaskModal: View {
    let listName: String
    let onSave: (TaskDraft) async throws(DataFailure) -> Void
    let onDelete: () -> Void
    let onClose: () -> Void

    @State private var draft: TaskDraft
    @State private var isSaving = false
    @State private var failure: DataFailure?

    init(
        task: BoardTask,
        listName: String,
        onSave: @escaping (TaskDraft) async throws(DataFailure) -> Void,
        onDelete: @escaping () -> Void,
        onClose: @escaping () -> Void
    ) {
        self.listName = listName
        self.onSave = onSave
        self.onDelete = onDelete
        self.onClose = onClose
        _draft = State(initialValue: TaskDraft(task: task))
    }

    var body: some View {
        ModalCard(width: 480) {
            HStack(alignment: .top, spacing: Spacing.s3) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(draft.color?.color ?? Color.bgComponentActive)
                    .strokeBorder(Color.borderHover, lineWidth: draft.color == nil ? 1 : 0)
                    .frame(width: 12, height: 12)
                    .padding(.top, 6)
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    TextField("Nombre de la tarea", text: $draft.name, axis: .vertical)
                        .lineLimit(1...4)
                        .textFieldStyle(.plain)
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(Color.textPrimary)
                    Text("En la lista \(Text(verbatim: listName).bold().foregroundStyle(Color.textPrimary))")
                        .font(.callout)
                        .foregroundStyle(Color.textSecondary)
                }

                IconButton(title: "Cerrar", systemImage: "xmark", action: onClose)
            }

            FormTextArea(title: "Descripción", text: $draft.description, prompt: "Añade más detalles…")

            VStack(alignment: .leading, spacing: 6) {
                Text("Color")
                    .font(.callout.weight(.medium))
                    .foregroundStyle(Color.textSecondary)
                PaletteColorPicker(selection: $draft.color)
                    .padding(.horizontal, -4)
            }

            if let failure {
                FieldMessageView(message: .error(failure.message))
            }

            Divider()
                .overlay(Color.borderSubtle)

            HStack(spacing: Spacing.s2) {
                Button("Eliminar tarea…", systemImage: "trash", action: onDelete)
                    .buttonStyle(.content(.plain))
                    .foregroundStyle(Color.dangerText)
                Spacer()
                Button("Cancelar", action: onClose)
                    .buttonStyle(.content(.secondary))
                    .keyboardShortcut(.cancelAction)
                Button(action: save) {
                    Text("Guardar")
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
        }
        .onSubmit(save)
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
