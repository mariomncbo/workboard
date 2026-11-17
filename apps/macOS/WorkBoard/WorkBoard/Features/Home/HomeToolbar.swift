import SwiftUI

/// Toolbar of Home: logo on the left, "Crear" next to the centered search field, and
/// the account button on the right. The controls get Liquid Glass from the system.
struct HomeToolbar: ToolbarContent {
    let profile: Profile
    let onCreateBoard: () -> Void
    let onShowProfile: () -> Void
    let onDeleteAccount: () -> Void

    var body: some ToolbarContent {
        ToolbarItem(placement: .navigation) {
            WorkBoardLogo()
                .padding(.horizontal, Spacing.s2)
        }
        .sharedBackgroundVisibility(.hidden)

        ToolbarItem(placement: .principal) {
            Button("Crear", systemImage: "plus", action: onCreateBoard)
                .labelStyle(.titleAndIcon)
                .buttonStyle(.glassProminent)
                .help("Crear tablero (⌘N)")
        }

        ToolbarItem(placement: .primaryAction) {
            UserMenuButton(profile: profile, onShowProfile: onShowProfile, onDeleteAccount: onDeleteAccount)
        }
    }
}
