import SwiftUI

/// A list column (264 pt): white or black, with its header. Tasks come later.
struct BoardListView: View {
    static let width = 264.0

    let list: BoardList
    let onRename: (String) -> Void
    let onSetStyle: (BoardListStyle) -> Void
    let onDelete: () -> Void

    @State private var isRenaming = false

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s1) {
            BoardListHeader(
                list: list,
                isRenaming: $isRenaming,
                onRename: onRename,
                onSetStyle: onSetStyle,
                onDelete: onDelete
            )
        }
        .padding(Spacing.s2)
        .frame(width: Self.width, alignment: .leading)
        .background(list.style.background, in: .rect(cornerRadius: Radius.md))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.md)
                .strokeBorder(list.style.border, lineWidth: 1)
        }
        .contentShape(.rect(cornerRadius: Radius.md))
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
