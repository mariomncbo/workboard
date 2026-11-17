import SwiftUI

/// Top of a list: its name (double-click to rename in place), number of tasks and "⋯".
struct BoardListHeader: View {
    let list: BoardList
    @Binding var isRenaming: Bool
    let onRename: (String) -> Void
    let onSetStyle: (BoardListStyle) -> Void
    let onDelete: () -> Void

    @State private var draftName = ""
    @FocusState private var isNameFieldFocused: Bool

    var body: some View {
        HStack(spacing: Spacing.s2) {
            if isRenaming {
                TextField("Nombre de la lista", text: $draftName)
                    .textFieldStyle(.plain)
                    .font(.headline)
                    .foregroundStyle(list.style.text)
                    .focused($isNameFieldFocused)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                    .background(list.style.field, in: .rect(cornerRadius: Radius.xs))
                    .overlay {
                        RoundedRectangle(cornerRadius: Radius.xs)
                            .strokeBorder(Color.focusRing, lineWidth: 2)
                    }
                    .onSubmit(commitRename)
                    .onExitCommand(perform: cancelRename)
                    .onChange(of: isNameFieldFocused) { _, isFocused in
                        if !isFocused {
                            commitRename()
                        }
                    }
                    .onAppear(perform: beginEditing)
            } else {
                Text(verbatim: list.name)
                    .font(.headline)
                    .foregroundStyle(list.style.text)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(.rect)
                    .onTapGesture(count: 2, perform: startRenaming)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityAction(named: "Renombrar", startRenaming)
            }

            Text(list.taskCount, format: .number)
                .font(.taskCount)
                .foregroundStyle(list.style.secondaryText)
                .accessibilityLabel(Text("^[\(list.taskCount) tarea](inflect: true)"))

            Menu {
                ListActions(style: list.style, onRename: startRenaming, onSetStyle: onSetStyle, onDelete: onDelete)
            } label: {
                Label("Opciones de la lista", systemImage: "ellipsis")
                    .labelStyle(.iconOnly)
                    .font(.callout.weight(.medium))
                    .foregroundStyle(list.style.secondaryText)
                    .frame(width: 22, height: 22)
                    .contentShape(.rect)
            }
            .menuStyle(.button)
            .buttonStyle(.plain)
            .menuIndicator(.hidden)
            .fixedSize()
            .help("Opciones de la lista")
        }
        .padding(.leading, 6)
        .padding(.trailing, 4)
        .padding(.top, 4)
        .padding(.bottom, 6)
    }

    private func startRenaming() {
        isRenaming = true
    }

    private func beginEditing() {
        draftName = list.name
        isNameFieldFocused = true
    }

    private func commitRename() {
        guard isRenaming else { return }
        isRenaming = false
        onRename(draftName)
    }

    private func cancelRename() {
        isRenaming = false
    }
}
