import SwiftUI

/// Last tile of the grid: an outlined "Crear tablero" button.
struct CreateBoardCard: View {
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: "plus")
                    .font(.title3)
                Text("Crear tablero")
                    .font(.control)
            }
            .foregroundStyle(isHovered ? Color.textPrimary : Color.textSecondary)
            .frame(maxWidth: .infinity, minHeight: 114)
            .background(isHovered ? Color.bgComponent : .clear, in: .rect(cornerRadius: Radius.sm))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.sm)
                    .strokeBorder(isHovered ? Color.borderHover : Color.border, lineWidth: 1)
            }
            .contentShape(.rect(cornerRadius: Radius.sm))
        }
        .buttonStyle(.plain)
        .onHover { isHovered = $0 }
        .animation(.easeOut(duration: 0.15), value: isHovered)
    }
}
