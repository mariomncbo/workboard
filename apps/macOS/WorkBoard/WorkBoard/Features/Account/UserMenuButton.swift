import SwiftUI

/// Round glass button with the user's initials (toolbar). Opens the user menu.
struct UserMenuButton: View {
    let profile: Profile
    let onShowProfile: () -> Void
    let onDeleteAccount: () -> Void

    @State private var isShowingMenu = false

    var body: some View {
        Button(action: showMenu) {
            Text(verbatim: Initials.from(profile.fullName))
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(isShowingMenu ? Color.accentText : Color.textPrimary)
                .frame(width: ControlMetrics.glassHeight, height: ControlMetrics.glassHeight)
        }
        .buttonBorderShape(.circle)
        .accessibilityLabel(Text("Cuenta de \(profile.fullName)"))
        .help(Text("Cuenta de \(profile.fullName)"))
        .popover(isPresented: $isShowingMenu, arrowEdge: .bottom) {
            UserMenu(
                profile: profile,
                onShowProfile: onShowProfile,
                onDeleteAccount: onDeleteAccount,
                onDismiss: hideMenu
            )
        }
    }

    private func showMenu() {
        isShowingMenu = true
    }

    private func hideMenu() {
        isShowingMenu = false
    }
}
