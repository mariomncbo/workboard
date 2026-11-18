import SwiftUI

/// What follows the pointer while dragging a list: the whole list with its tasks, slightly
/// tilted and lifted. Very long lists show their first tasks and how many more there are.
struct BoardListDragPreview: View {
    let list: BoardList
    let tasks: [BoardTask]

    private static let maximumVisibleTasks = 12

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s1) {
            HStack(spacing: Spacing.s2) {
                Text(verbatim: list.name)
                    .font(.headline)
                    .foregroundStyle(list.style.text)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(list.taskCount, format: .number)
                    .font(.taskCount)
                    .foregroundStyle(list.style.secondaryText)
                Image(systemName: "ellipsis")
                    .font(.callout.weight(.medium))
                    .foregroundStyle(list.style.secondaryText)
                    .frame(width: 22, height: 22)
            }
            .padding(.leading, 6)
            .padding(.trailing, 4)
            .padding(.top, 4)
            .padding(.bottom, 6)

            ForEach(tasks.prefix(Self.maximumVisibleTasks)) { task in
                TaskCardFace(task: task, listStyle: list.style)
            }

            if tasks.count > Self.maximumVisibleTasks {
                Text(verbatim: "y \(CountText.tasks(tasks.count - Self.maximumVisibleTasks)) más")
                    .font(.subheadline)
                    .foregroundStyle(list.style.secondaryText)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 4)
            }
        }
        .padding(Spacing.s2)
        .frame(width: BoardListView.width, alignment: .leading)
        .background(list.style.background, in: .rect(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(list.style.border, lineWidth: 1)
        }
        .rotationEffect(.degrees(-1.5))
        .elevation(.lift)
        .padding(Spacing.s3)
    }
}
