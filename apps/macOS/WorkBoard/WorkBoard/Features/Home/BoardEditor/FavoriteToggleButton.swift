import SwiftUI

/// "Marcar como favorito" with a star that fills when selected.
struct FavoriteToggleButton: View {
    @Binding var isFavorite: Bool

    var body: some View {
        Button(action: toggle) {
            Label {
                Text("Marcar como favorito")
                    .foregroundStyle(Color.textPrimary)
            } icon: {
                Image(systemName: isFavorite ? "star.fill" : "star")
                    .foregroundStyle(isFavorite ? Color.favorite : Color.textSecondary)
            }
            .font(.body)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isFavorite ? .isSelected : [])
    }

    private func toggle() {
        isFavorite.toggle()
    }
}
