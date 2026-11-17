import SwiftUI

/// What follows the pointer while dragging a task: the card, slightly tilted and lifted.
struct TaskDragPreview: View {
    let task: BoardTask
    let listStyle: BoardListStyle

    var body: some View {
        TaskCardFace(task: task, listStyle: listStyle)
            .frame(width: BoardListView.width - Spacing.s2 * 2)
            .rotationEffect(.degrees(-1.5))
            .elevation(.lift)
            .padding(Spacing.s3)
    }
}
