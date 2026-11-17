import SwiftUI

/// A task in a list. Without color it takes the list's field color; with color, the
/// palette color and white text. Click opens the task. It can be dragged, and a task
/// dropped on it goes just before it (a line marks the spot). A list dropped on it is
/// handed to its list.
struct TaskCard: View {
    let task: BoardTask
    let listStyle: BoardListStyle
    let onOpen: () -> Void
    let onSetColor: (PaletteColor?) -> Void
    let onDelete: () -> Void
    /// A dragged task was dropped on this card.
    let onDropTask: (UUID) -> Void
    /// A dragged list was dropped on this card.
    let onDropList: (UUID) -> Void

    @State private var isHovered = false
    @State private var isDropTarget = false

    var body: some View {
        Button(action: onOpen) {
            TaskCardFace(task: task, listStyle: listStyle)
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.xs)
                        .strokeBorder(Color.black.opacity(isHovered ? 0.18 : 0), lineWidth: 1)
                }
                .contentShape(.rect(cornerRadius: Radius.xs))
        }
        .buttonStyle(.plain)
        .overlay(alignment: .top) {
            // Insertion line: the dropped task will go here.
            Capsule()
                .fill(Color.focusRing)
                .frame(height: 3)
                .offset(y: -3.5)
                .opacity(isDropTarget ? 1 : 0)
                .allowsHitTesting(false)
        }
        .onHover { isHovered = $0 }
        .draggable(BoardDragItem.task(task.id)) {
            TaskDragPreview(task: task, listStyle: listStyle)
        }
        .dropDestination(for: BoardDragItem.self) { items, _ in
            switch items.first {
            case .task(let taskID) where taskID != task.id:
                onDropTask(taskID)
                return true
            case .list(let listID):
                onDropList(listID)
                return true
            default:
                return false
            }
        } isTargeted: { isTargeted in
            isDropTarget = isTargeted
        }
        .contextMenu {
            TaskActions(color: task.color, onOpen: onOpen, onSetColor: onSetColor, onDelete: onDelete)
        }
        .accessibilityValue(task.color.map { Text($0.name) } ?? Text(verbatim: ""))
    }
}
