import SwiftUI

/// Context menu of a task: open it, change its color or delete it.
struct TaskActions: View {
    let color: PaletteColor?
    let onOpen: () -> Void
    let onSetColor: (PaletteColor?) -> Void
    let onDelete: () -> Void

    var body: some View {
        Button("Abrir", systemImage: "arrow.up.right.square", action: onOpen)

        Menu("Color", systemImage: "paintpalette") {
            colorButton(nil, name: "Sin color")
            Divider()
            ForEach(PaletteColor.allCases) { option in
                colorButton(option, name: option.name)
            }
        }

        Divider()

        Button("Eliminar tarea…", systemImage: "trash", role: .destructive, action: onDelete)
    }

    private func colorButton(_ option: PaletteColor?, name: LocalizedStringResource) -> some View {
        Button {
            onSetColor(option)
        } label: {
            if option == color {
                Label {
                    Text(name)
                } icon: {
                    Image(systemName: "checkmark")
                }
            } else {
                Text(name)
            }
        }
    }
}
