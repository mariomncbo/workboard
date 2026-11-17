import SwiftUI

/// A list column (264 pt): white or black, with its header, tasks and "Añade una tarea".
/// The tasks scroll inside the list when they do not fit in the window. A task dropped
/// anywhere on the list (also an empty one) goes to the end; dropped on a task, just before it.
/// The list itself is dragged from anywhere outside its tasks, and dropped on another list.
struct BoardListView: View {
    static let width = 264.0

    let list: BoardList
    let tasks: [BoardTask]
    let onRename: (String) -> Void
    let onSetStyle: (BoardListStyle) -> Void
    let onDelete: () -> Void
    let onAddTask: (String) async throws(DataFailure) -> Void
    let onOpenTask: (BoardTask) -> Void
    let onSetTaskColor: (BoardTask, PaletteColor?) -> Void
    let onDeleteTask: (BoardTask) -> Void
    /// A task was dropped: its ID, and the task it goes before (`nil` for the end).
    let onMoveTask: (UUID, UUID?) -> Void
    /// Another list was dropped on this one.
    let onMoveList: (UUID) -> Void

    @State private var isRenaming = false
    @State private var isHovered = false
    @State private var isDropTarget = false
    @State private var tasksHeight = 0.0

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s1) {
            BoardListHeader(
                list: list,
                isRenaming: $isRenaming,
                onRename: onRename,
                onSetStyle: onSetStyle,
                onDelete: onDelete
            )

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s1) {
                    ForEach(tasks) { task in
                        TaskCard(
                            task: task,
                            listStyle: list.style,
                            onOpen: { onOpenTask(task) },
                            onSetColor: { onSetTaskColor(task, $0) },
                            onDelete: { onDeleteTask(task) },
                            onDropTask: { onMoveTask($0, task.id) },
                            onDropList: onMoveList
                        )
                    }
                }
                .onGeometryChange(for: Double.self) { proxy in
                    proxy.size.height
                } action: { height in
                    tasksHeight = height
                }
            }
            .scrollBounceBehavior(.basedOnSize)
            // As tall as the tasks, but it shrinks and scrolls when the window is shorter.
            .frame(minHeight: 0, idealHeight: tasksHeight, maxHeight: tasksHeight)

            AddTaskField(style: list.style, isListHovered: isHovered || isDropTarget, onAdd: onAddTask)
        }
        .padding(Spacing.s2)
        .frame(width: Self.width, alignment: .leading)
        .background(list.style.background, in: .rect(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(isDropTarget ? Color.focusRing : list.style.border, lineWidth: isDropTarget ? 2 : 1)
        }
        .onHover { isHovered = $0 }
        .draggable(BoardDragItem.list(list.id)) {
            BoardListDragPreview(list: list, tasks: tasks)
        }
        .dropDestination(for: BoardDragItem.self) { items, _ in
            switch items.first {
            case .task(let taskID):
                onMoveTask(taskID, nil)
                return true
            case .list(let listID):
                onMoveList(listID)
                return true
            case nil:
                return false
            }
        } isTargeted: { isTargeted in
            isDropTarget = isTargeted
        }
        .contextMenu {
            ListActions(style: list.style, onRename: startRenaming, onSetStyle: onSetStyle, onDelete: onDelete)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: list.name))
    }

    private func startRenaming() {
        isRenaming = true
    }
}
