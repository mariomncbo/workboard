import SwiftUI

/// Temporary signed-in screen, to try the authentication flow until Home is built.
struct HomePlaceholderView: View {
    let profile: Profile

    @Environment(AuthService.self) private var auth

    var body: some View {
        VStack(spacing: Spacing.s5) {
            AvatarView(fullName: profile.fullName, size: .large)

            VStack(spacing: 4) {
                Text("Hola, \(profile.fullName)")
                    .font(.screenTitle)
                    .foregroundStyle(Color.textPrimary)
                Text(verbatim: "@\(profile.nickname)")
                    .font(.body)
                    .foregroundStyle(Color.textSecondary)
            }

            HStack(spacing: Spacing.s2) {
                Button("Cambiar de cuenta", action: auth.beginAccountSwitch)
                    .buttonStyle(.content(.secondary))
                Button("Cerrar sesión", action: signOut)
                    .buttonStyle(.content(.secondary))
            }
        }
        .appBackground()
    }

    private func signOut() {
        Task {
            await auth.signOut()
        }
    }
}
