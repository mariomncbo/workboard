import SwiftUI

/// Login and Register. Also shown on top of a live session when switching accounts.
struct AuthFlowView: View {
    @Environment(AuthService.self) private var auth
    @State private var screen = AuthScreen.login

    var body: some View {
        AuthScreenLayout {
            switch screen {
            case .login:
                LoginView(onCreateAccount: showRegister)
            case .register:
                RegisterView(onSignIn: showLogin)
            }
        }
        .overlay(alignment: .topTrailing) {
            if auth.isSwitchingAccount {
                Button("Volver a mi cuenta", systemImage: "xmark", action: auth.cancelAccountSwitch)
                    .buttonStyle(.content(.secondary))
                    .keyboardShortcut(.cancelAction)
                    .padding(Spacing.s5)
            }
        }
    }

    private func showRegister() {
        withAnimation(.smooth(duration: 0.2)) {
            screen = .register
        }
    }

    private func showLogin() {
        withAnimation(.smooth(duration: 0.2)) {
            screen = .login
        }
    }
}
