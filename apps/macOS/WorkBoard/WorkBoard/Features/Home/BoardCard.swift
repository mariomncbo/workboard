import SwiftUI

/// A board in "Mi espacio de trabajo": color strip, name and summary.
/// The star (top left) and "⋯" (top right) appear under the pointer; a favorite
/// always shows its filled star.
struct BoardCard: View {
    let board: Board
    let summary: BoardSummary
    let onOpen: () -> Void
    let onToggleFavorite: () -> Void
    let onShowSettings: () -> Void
    let onDelete: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: onOpen) {
            VStack(alignment: .leading, spacing: 0) {
                BoardCover(background: board.background)
                    .frame(height: 64)

                VStack(alignment: .leading, spacing: 2) {
                    Text(verbatim: board.name)
                        .font(.headline)
                        .foregroundStyle(Color.textPrimary)
                        .lineLimit(1)
                    BoardSummaryText(summary: summary)
                        .font(.subheadline)
                        .foregroundStyle(Color.textSecondary)
                }
                .padding(.horizontal, Spacing.s3)
                .padding(.top, 10)
                .padding(.bottom, Spacing.s3)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.bgComponent)
            .clipShape(.rect(cornerRadius: Radius.sm))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.sm)
                    .strokeBorder(isHovered ? Color.borderHover : Color.borderSubtle, lineWidth: 1)
            }
            .contentShape(.rect(cornerRadius: Radius.sm))
        }
        .buttonStyle(.plain)
        .overlay(alignment: .topLeading) {
            IconButton(
                title: board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos",
                systemImage: board.isFavorite ? "star.fill" : "star",
                tint: board.isFavorite ? .favorite : .onPalette,
                action: onToggleFavorite
            )
            .padding(6)
            .opacity(isHovered || board.isFavorite ? 1 : 0)
            .allowsHitTesting(isHovered || board.isFavorite)
        }
        .overlay(alignment: .topTrailing) {
            IconButton(title: "Configuración del tablero", systemImage: "ellipsis", tint: .onPalette, action: onShowSettings)
                .padding(6)
                .opacity(isHovered ? 1 : 0)
                .allowsHitTesting(isHovered)
        }
        .onHover { isHovered = $0 }
        .animation(.easeOut(duration: 0.15), value: isHovered)
        .contextMenu {
            Button("Abrir", systemImage: "arrow.up.right.square", action: onOpen)
            Button(
                board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos",
                systemImage: board.isFavorite ? "star.slash" : "star",
                action: onToggleFavorite
            )
            Button("Configuración del tablero…", systemImage: "slider.horizontal.3", action: onShowSettings)
            Divider()
            Button("Eliminar tablero…", systemImage: "trash", role: .destructive, action: onDelete)
        }
        .accessibilityElement(children: .combine)
        .accessibilityValue(board.isFavorite ? Text("Favorito") : Text(verbatim: ""))
        .accessibilityAction(named: board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos", onToggleFavorite)
        .accessibilityAction(named: "Configuración del tablero", onShowSettings)
    }
}
