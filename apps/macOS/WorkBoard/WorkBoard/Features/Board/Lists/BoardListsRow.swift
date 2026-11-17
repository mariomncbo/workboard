import SwiftUI

/// The board's lists side by side, scrolling horizontally. Lists and tasks are dragged and
/// dropped: a list onto another list, a task within its list or to another one.
struct BoardListsRow: View {
    let model: BoardModel
    let onRename: (BoardList, String) -> Void
    let onSetStyle: (BoardList, BoardListStyle) -> Void
    let onDelete: (BoardList) -> Void
    let onOpenTask: (BoardTask) -> Void
    let onSetTaskColor: (BoardTask, PaletteColor?) -> Void
    let onDeleteTask: (BoardTask) -> Void

    var body: some View {
        ScrollView(.horizontal) {
            HStack(alignment: .top, spacing: Spacing.s3) {
                ForEach(model.lists) { list in
                    BoardListView(
                        list: list,
                        tasks: model.tasks(in: list),
                        onRename: { onRename(list, $0) },
                        onSetStyle: { onSetStyle(list, $0) },
                        onDelete: { onDelete(list) },
                        onAddTask: { name throws(DataFailure) in try await model.addTask(named: name, to: list) },
                        onOpenTask: onOpenTask,
                        onSetTaskColor: onSetTaskColor,
                        onDeleteTask: onDeleteTask,
                        onMoveTask: { taskID, followingID in
                            model.moveTask(taskID, toList: list.id, before: followingID)
                        },
                        onMoveList: { listID in
                            model.moveList(listID, onto: list.id)
                        }
                    )
                }
            }
            .padding(.horizontal, Spacing.s5)
            .padding(.top, 16)
            // Room for the floating bar.
            .padding(.bottom, 100)
            .frame(maxHeight: .infinity, alignment: .top)
        }
    }
}
