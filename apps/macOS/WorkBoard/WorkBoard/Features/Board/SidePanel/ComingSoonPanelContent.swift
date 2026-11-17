import SwiftUI

/// Placeholder inside a side panel that is not built yet: icon, "Próximamente" and what it will do.
struct ComingSoonPanelContent: View {
    let systemImage: String
    let message: LocalizedStringKey

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: systemImage)
                .font(.title)
                .foregroundStyle(Color.textTertiary)
                .accessibilityHidden(true)
            Text("Próximamente")
                .font(.headline)
                .foregroundStyle(Color.textPrimary)
            Text(message)
                .font(.callout)
                .foregroundStyle(Color.textSecondary)
        }
        .multilineTextAlignment(.center)
        .padding(.horizontal, 32)
        .padding(.bottom, 80)
    }
}
