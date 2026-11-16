import SwiftUI

/// Grid of board cards, with "Crear tablero" as the last tile.
struct BoardGrid: View {
    let boards: [Board]
    let summary: (Board) -> BoardSummary
    let onOpen: (Board) -> Void
    let onToggleFavorite: (Board) -> Void
    let onShowSettings: (Board) -> Void
    let onDelete: (Board) -> Void
    let onCreate: () -> Void

    private let columns = [GridItem(.adaptive(minimum: 220, maximum: 360), spacing: Spacing.s5, alignment: .top)]

    var body: some View {
        LazyVGrid(columns: columns, alignment: .leading, spacing: Spacing.s5) {
            ForEach(boards) { board in
                BoardCard(
                    board: board,
                    summary: summary(board),
                    onOpen: { onOpen(board) },
                    onToggleFavorite: { onToggleFavorite(board) },
                    onShowSettings: { onShowSettings(board) },
                    onDelete: { onDelete(board) }
                )
            }
            CreateBoardCard(action: onCreate)
        }
    }
}
