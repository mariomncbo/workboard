import SwiftUI

/// Shown next to the "Nickname" label while typing: checking, or available.
struct NicknameStatusLabel: View {
    let status: NicknameStatus

    var body: some View {
        switch status {
        case .checking:
            ProgressView()
                .controlSize(.mini)
                .accessibilityLabel("Comprobando el nickname")
        case .available:
            Label("Disponible", systemImage: "checkmark.circle.fill")
                .foregroundStyle(Color.accentText)
        case .unchecked, .taken:
            EmptyView()
        }
    }
}
