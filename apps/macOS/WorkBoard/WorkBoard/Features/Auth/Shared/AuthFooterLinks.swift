import SwiftUI

/// Links to the GitHub repository and the website, at the bottom right of Login and Register.
/// Until the website has an address, "Web" is shown but cannot be clicked.
struct AuthFooterLinks: View {
    var body: some View {
        HStack(spacing: 16) {
            Link(destination: AppLinks.repository) {
                Label("GitHub", systemImage: "chevron.left.forwardslash.chevron.right")
            }
            if let website = AppLinks.website {
                Link(destination: website) {
                    Label("Web", systemImage: "globe")
                }
            } else {
                Label("Web", systemImage: "globe")
                    .foregroundStyle(Color.textTertiary)
                    .help("La web estará disponible pronto.")
                    .accessibilityValue("Próximamente")
            }
        }
        .font(.callout)
        .foregroundStyle(Color.textSecondary)
        .pointerStyle(.link)
    }
}
