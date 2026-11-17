import SwiftUI

/// Actions of a list, shared by its "⋯" menu and its context menu.
struct ListActions: View {
    let style: BoardListStyle
    let onRename: () -> Void
    let onSetStyle: (BoardListStyle) -> Void
    let onDelete: () -> Void

    var body: some View {
        Button("Renombrar", systemImage: "pencil", action: onRename)

        Menu("Estilo", systemImage: "circle.lefthalf.filled") {
            ForEach(BoardListStyle.allCases) { option in
                Button {
                    onSetStyle(option)
                } label: {
                    if option == style {
                        Label {
                            Text(option.name)
                        } icon: {
                            Image(systemName: "checkmark")
                        }
                    } else {
                        Text(option.name)
                    }
                }
            }
        }

        Divider()

        Button("Eliminar lista…", systemImage: "trash", role: .destructive, action: onDelete)
    }
}
