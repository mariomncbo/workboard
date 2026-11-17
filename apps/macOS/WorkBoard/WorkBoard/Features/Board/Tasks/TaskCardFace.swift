import SwiftUI

/// How a task looks: name (and a mark if it has a description) on its color, or on the
/// list's field color when it has none. Shared by the card and the drag previews.
struct TaskCardFace: View {
    let task: BoardTask
    let listStyle: BoardListStyle

    var body: some View {
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
    }
}
