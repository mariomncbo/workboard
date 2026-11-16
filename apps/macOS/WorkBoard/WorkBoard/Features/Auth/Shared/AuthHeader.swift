import SwiftUI

/// Logo and one-line explanation at the top of each authentication screen.
struct AuthHeader: View {
    let subtitle: LocalizedStringKey

    var body: some View {
        VStack(spacing: 12) {
            WorkBoardLogo(height: 50)
                .accessibilityAddTraits(.isHeader)
            Text(subtitle)
                .font(.body)
                .foregroundStyle(Color.textSecondary)
                .multilineTextAlignment(.center)
        }
    }
}
