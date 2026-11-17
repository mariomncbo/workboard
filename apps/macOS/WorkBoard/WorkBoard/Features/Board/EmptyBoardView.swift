import SwiftUI

/// Shown when the board has no lists yet.
struct EmptyBoardView: View {
    /// On a colored board, text uses the palette's text color.
    let isOnColor: Bool
    let onAddList: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            HStack(alignment: .top, spacing: Spacing.s2) {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.bgComponent)
                    .strokeBorder(Color.border, lineWidth: 1)
                    .frame(width: 44, height: 64)
                RoundedRectangle(cornerRadius: 8)
                    .strokeBorder(Color.borderSubtle, lineWidth: 1)
                    .frame(width: 44, height: 48)
                RoundedRectangle(cornerRadius: 8)
                    .strokeBorder(Color.borderSubtle, lineWidth: 1)
                    .frame(width: 44, height: 56)
            }
            .accessibilityHidden(true)

            Text("Este tablero aún no tiene listas")
                .font(.modalTitle)
                .foregroundStyle(isOnColor ? Color.onPalette : Color.textPrimary)

            Text("Crea la primera lista para empezar a organizar las tareas.")
                .font(.body)
                .foregroundStyle(isOnColor ? Color.onPalette.opacity(0.85) : Color.textSecondary)

            Button("Añade una lista", systemImage: "plus", action: onAddList)
                .buttonStyle(.content(.primary))
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: 340)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.bottom, 80)
    }
}
