import SwiftUI

/// Small live preview of the board being created.
struct BoardPreviewCard: View {
    let draft: BoardDraft

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            BoardCover(background: draft.background)
                .frame(height: 44)

            VStack(alignment: .leading, spacing: 2) {
                Group {
                    if draft.trimmedName.isEmpty {
                        Text("Nuevo tablero")
                    } else {
                        Text(verbatim: draft.trimmedName)
                    }
                }
                .font(.callout.weight(.semibold))
                .foregroundStyle(Color.textPrimary)
                .lineLimit(1)

                Text("Sin listas")
                    .font(.caption)
                    .foregroundStyle(Color.textSecondary)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, Spacing.s2)

            Spacer(minLength: 0)
        }
        .frame(width: 132)
        .background(Color.bgComponentHover)
        .clipShape(.rect(cornerRadius: Radius.sm))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.sm)
                .strokeBorder(Color.borderSubtle, lineWidth: 1)
        }
        .accessibilityHidden(true)
    }
}
