import SwiftUI

/// The board's lists side by side, scrolling horizontally, reordered by dragging.
struct BoardListsRow: View {
    let lists: [BoardList]
    let onReorder: (ReorderDifference<UUID, ReorderableSingleCollectionIdentifier>) -> Void
    let onRename: (BoardList, String) -> Void
    let onSetStyle: (BoardList, BoardListStyle) -> Void
    let onDelete: (BoardList) -> Void

    var body: some View {
        ScrollView(.horizontal) {
            HStack(alignment: .top, spacing: Spacing.s3) {
                ForEach(lists) { list in
                    BoardListView(
                        list: list,
                        onRename: { onRename(list, $0) },
                        onSetStyle: { onSetStyle(list, $0) },
                        onDelete: { onDelete(list) }
                    )
                }
                .reorderable()
            }
            .padding(.horizontal, Spacing.s5)
            .padding(.top, 16)
            // Room for the floating bar.
            .padding(.bottom, 100)
            .frame(maxHeight: .infinity, alignment: .top)
        }
        .scrollIndicators(.automatic)
        .reorderContainer(for: BoardList.self, move: onReorder)
    }
}
