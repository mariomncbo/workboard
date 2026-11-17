import SwiftUI

/// The only way to create a task: "Añade una tarea" at the bottom of a list turns into a
/// field with "Añadir" and ✕. After adding, the field stays open for the next task.
struct AddTaskField: View {
    let style: BoardListStyle
    let onAdd: (String) async throws(DataFailure) -> Void

    @State private var isEditing = false
    @State private var text = ""
    @State private var isAdding = false
    @State private var failure: DataFailure?
    @State private var isHovered = false
    @FocusState private var isFocused: Bool

    /// Task names are one paragraph: line breaks become spaces.
    private var taskName: String {
        text.split(whereSeparator: \.isNewline)
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespaces)
    }

    private var canAdd: Bool {
        !taskName.isEmpty && taskName.count <= BoardTask.maximumNameLength && !isAdding
    }

    var body: some View {
        if isEditing {
            VStack(alignment: .leading, spacing: Spacing.s2) {
                TextField("Nombre de la tarea", text: $text, prompt: Text("Escribe el nombre de la tarea…").foregroundStyle(style.secondaryText), axis: .vertical)
                    .lineLimit(2...6)
                    .textFieldStyle(.plain)
                    .font(.body)
                    .foregroundStyle(style.text)
                    .focused($isFocused)
                    .padding(.vertical, 7)
                    .padding(.horizontal, 9)
                    .frame(minHeight: 50, alignment: .topLeading)
                    .background(style.field, in: .rect(cornerRadius: Radius.xs))
                    .overlay {
                        RoundedRectangle(cornerRadius: Radius.xs)
                            .strokeBorder(Color.focusRing, lineWidth: 2)
                    }
                    .onSubmit(add)
                    .onExitCommand(perform: cancel)
                    .onAppear(perform: focusField)

                if let failure {
                    Label {
                        Text(failure.message)
                    } icon: {
                        Image(systemName: "exclamationmark.circle")
                    }
                    .font(.subheadline)
                    .foregroundStyle(style.secondaryText)
                }

                HStack(spacing: Spacing.s1) {
                    Button(action: add) {
                        Label("Añadir", systemImage: "checkmark")
                            .opacity(isAdding ? 0 : 1)
                            .overlay {
                                if isAdding {
                                    ProgressView()
                                        .controlSize(.small)
                                        .tint(Color.onAccent)
                                }
                            }
                    }
                    .buttonStyle(.content(.primary))
                    .disabled(!canAdd)

                    IconButton(title: "Cancelar", systemImage: "xmark", tint: style.secondaryText, action: cancel)
                }
            }
        } else {
            Button(action: startEditing) {
                Label("Añade una tarea", systemImage: "plus")
                    .font(.body)
                    .foregroundStyle(style.secondaryText)
                    .padding(6)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(isHovered ? style.field : .clear, in: .rect(cornerRadius: Radius.xs))
                    .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .onHover { isHovered = $0 }
        }
    }

    private func startEditing() {
        failure = nil
        isEditing = true
    }

    private func focusField() {
        isFocused = true
    }

    private func cancel() {
        text = ""
        failure = nil
        isEditing = false
    }

    private func add() {
        guard canAdd else { return }
        let name = taskName
        isAdding = true
        failure = nil
        Task {
            do {
                try await onAdd(name)
                text = ""
                isFocused = true
            } catch {
                failure = error as? DataFailure ?? .unexpected
            }
            isAdding = false
        }
    }
}
