import SwiftUI

/// Toolbar of a board: logo (back to Home) on the left, name and star in the center,
/// settings and account on the right.
struct BoardToolbar: ToolbarContent {
    let board: Board
    let profile: Profile
    let onGoHome: () -> Void
    let onToggleFavorite: () -> Void
    let onShowSettings: () -> Void
    let onShowProfile: () -> Void
    let onDeleteAccount: () -> Void

    var body: some ToolbarContent {
        ToolbarItem(placement: .navigation) {
            Button(action: onGoHome) {
                WorkBoardLogo()
                    .padding(.horizontal, Spacing.s2)
            }
            .buttonStyle(.plain)
            .help("Volver a Inicio")
            .accessibilityLabel("WorkBoard, volver a Inicio")
        }
        .sharedBackgroundVisibility(.hidden)

        ToolbarItem(placement: .principal) {
            HStack(spacing: 6) {
                Text(verbatim: board.name)
                    .font(.modalTitle)
                    .foregroundStyle(board.background == .dots ? Color.textPrimary : Color.onPalette)
                    .lineLimit(1)
                    .accessibilityAddTraits(.isHeader)
                IconButton(
                    title: board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos",
                    systemImage: board.isFavorite ? "star.fill" : "star",
                    tint: board.isFavorite ? .favorite : .textSecondary,
                    action: onToggleFavorite
                )
            }
            .padding(.horizontal, Spacing.s2)
        }
        .sharedBackgroundVisibility(.hidden)

        ToolbarItem(placement: .primaryAction) {
            Button("Configuración del tablero", systemImage: "ellipsis", action: onShowSettings)
                .labelStyle(.iconOnly)
                .help("Configuración del tablero")
        }

        ToolbarItem(placement: .primaryAction) {
            UserMenuButton(profile: profile, onShowProfile: onShowProfile, onDeleteAccount: onDeleteAccount)
        }
    }
}
