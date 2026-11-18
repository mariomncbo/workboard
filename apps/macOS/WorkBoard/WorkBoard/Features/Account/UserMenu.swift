import SwiftUI

/// Panel under the avatar: who is signed in, other accounts, profile, settings,
/// links, sign out and delete account.
struct UserMenu: View {
    let profile: Profile
    let onShowProfile: () -> Void
    let onDeleteAccount: () -> Void
    let onDismiss: () -> Void

    @Environment(AuthService.self) private var auth
    @Environment(\.openSettings) private var openSettings
    @Environment(\.openURL) private var openURL

    private var otherAccounts: [RecentAccount] {
        auth.recentAccounts.accounts.filter { $0.id != profile.id }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: Spacing.s3) {
                AvatarView(fullName: profile.fullName, size: .large)
                VStack(alignment: .leading, spacing: 2) {
                    Text(verbatim: profile.fullName)
                        .font(.headline)
                        .foregroundStyle(Color.textPrimary)
                    Text(verbatim: identityLine)
                        .font(.subheadline)
                        .foregroundStyle(Color.textSecondary)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }
            .padding(.horizontal, 10)
            .padding(.top, Spacing.s3)
            .padding(.bottom, 14)

            menuDivider

            UserMenuSectionTitle(title: "Cambiar de cuenta")
            ForEach(otherAccounts) { account in
                UserMenuRow(LocalizedStringKey(account.fullName), detail: Text(verbatim: "@\(account.nickname)")) {
                    run { await auth.switchTo(account) }
                } leading: {
                    AvatarView(fullName: account.fullName, size: .mini)
                }
            }
            UserMenuRow("Entrar con otra cuenta…") {
                run { auth.beginAccountSwitch() }
            }

            menuDivider

            UserMenuRow("Perfil…") { run(onShowProfile) }
            UserMenuRow("Configuración…", detail: Text(verbatim: "⌘,")) {
                run { openSettings() }
            }
            UserMenuRow("Apoyar en GitHub ⭐️") {
                run { openURL(AppLinks.repository) }
            }
            UserMenuRow("Visitar la web") {
                run { openURL(AppLinks.website) }
            }

            menuDivider

            UserMenuRow("Cerrar sesión") {
                run { await auth.signOut() }
            }
            UserMenuRow("Eliminar cuenta…", isDestructive: true) { run(onDeleteAccount) }
        }
        .padding(6)
        .frame(width: 300)
        .presentationBackground(Color.bgComponent)
    }

    private var identityLine: String {
        if let email = auth.currentEmail {
            "@\(profile.nickname) · \(email)"
        } else {
            "@\(profile.nickname)"
        }
    }

    private var menuDivider: some View {
        Divider()
            .overlay(Color.borderSubtle)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
    }

    /// Closes the menu, then runs the action.
    private func run(_ action: @escaping () -> Void) {
        onDismiss()
        action()
    }

    private func run(_ action: @escaping () async -> Void) {
        onDismiss()
        Task {
            await action()
        }
    }
}
