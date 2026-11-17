import SwiftUI

/// A list column (264 pt): white or black, with its header, tasks and "Añade una tarea".
/// The tasks scroll inside the list when they do not fit in the window.
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

    @State private var isRenaming = false
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
                            onDelete: { onDeleteTask(task) }
                        )
                    }
                    .reorderable(collectionID: list.id)
                }
                // A small drop area keeps empty lists reachable when dragging a task.
                .frame(minHeight: tasks.isEmpty ? 6 : 0)
                .onGeometryChange(for: Double.self) { proxy in
                    proxy.size.height
                } action: { height in
                    tasksHeight = height
                }
            }
            .scrollBounceBehavior(.basedOnSize)
            // As tall as the tasks, but it shrinks and scrolls when the window is shorter.
            .frame(minHeight: 0, idealHeight: tasksHeight, maxHeight: tasksHeight)

            AddTaskField(style: list.style, onAdd: onAddTask)
        }
        .padding(Spacing.s2)
        .frame(width: Self.width, alignment: .leading)
        .background(list.style.background, in: .rect(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(list.style.border, lineWidth: 1)
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
