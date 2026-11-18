import SwiftUI

/// Links to the GitHub repository and the website, at the bottom right of Login and Register.
struct AuthFooterLinks: View {
    var body: some View {
        HStack(spacing: 16) {
            Link(destination: AppLinks.repository) {
                Label("GitHub", systemImage: "chevron.left.forwardslash.chevron.right")
            }
            Link(destination: AppLinks.website) {
                Label("Web", systemImage: "globe")
            }
        }
        .font(.callout)
        .foregroundStyle(Color.textSecondary)
        .pointerStyle(.link)
    }
}
