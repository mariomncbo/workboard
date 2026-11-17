import SwiftUI

/// A task in a list. Without color it takes the list's field color; with color, the
/// palette color and white text. Click opens the task; it can be dragged to reorder or
/// to move it to another list.
struct TaskCard: View {
    let task: BoardTask
    let listStyle: BoardListStyle
    let onOpen: () -> Void
    let onSetColor: (PaletteColor?) -> Void
    let onDelete: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: onOpen) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(verbatim: task.name)
                    .font(.body)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if task.description?.isEmpty == false {
                    Image(systemName: "text.alignleft")
                        .font(.caption)
                        .opacity(0.7)
                        .accessibilityLabel("Tiene descripción")
                }
            }
            .foregroundStyle(task.color == nil ? listStyle.text : Color.onPalette)
            .padding(.vertical, 7)
            .padding(.horizontal, 9)
            .background(task.color?.color ?? listStyle.field, in: .rect(cornerRadius: Radius.xs))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.xs)
                    .strokeBorder(Color.black.opacity(isHovered ? 0.18 : 0), lineWidth: 1)
            }
            .contentShape(.rect(cornerRadius: Radius.xs))
        }
        .buttonStyle(.plain)
        .onHover { isHovered = $0 }
        .contextMenu {
            TaskActions(color: task.color, onOpen: onOpen, onSetColor: onSetColor, onDelete: onDelete)
        }
        .accessibilityValue(task.color.map { Text($0.name) } ?? Text(verbatim: ""))
    }
}
