import SwiftUI

/// Top-level view of the window: shows the authentication flow or the signed-in app,
/// restores the session at launch and handles links that open the app.
struct RootView: View {
    @Environment(AuthService.self) private var auth

    var body: some View {
        // A ZStack (not a Group) so `task` runs once for the window, not once per screen.
        ZStack {
            switch auth.state {
            case .loading:
                ProgressView()
                    .controlSize(.small)
                    .appBackground()
            case .signedOut:
                AuthFlowView()
            case .signedIn(let profile):
                if auth.isSwitchingAccount {
                    AuthFlowView()
                } else {
                    HomePlaceholderView(profile: profile)
                }
            case .choosingNewPassword:
                NewPasswordView()
            }
        }
        .task {
            await auth.observeSession()
        }
        .onOpenURL { url in
            Task {
                await auth.handleOpenURL(url)
            }
        }
        .handlesExternalEvents(preferring: ["*"], allowing: ["*"])
    }
}
