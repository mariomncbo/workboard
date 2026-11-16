import SwiftUI

/// Small icon-only button (22 pt) with a hover background: close buttons, the star and
/// "⋯" of board cards, the "⋯" of lists. The title is kept for VoiceOver and the tooltip.
struct IconButton: View {
    let title: LocalizedStringKey
    let systemImage: String
    var tint = Color.textSecondary
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .labelStyle(.iconOnly)
                .font(.callout.weight(.medium))
                .foregroundStyle(tint)
                .frame(width: 22, height: 22)
                .background(isHovered ? Color.black.opacity(0.18) : .clear, in: .rect(cornerRadius: Radius.xs))
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .onHover { isHovered = $0 }
        .help(Text(title))
    }
}
