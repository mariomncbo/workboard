import SwiftUI

/// Login: recent accounts of this Mac, and sign-in with email or nickname.
struct LoginView: View {
    let onCreateAccount: () -> Void

    @Environment(AuthService.self) private var auth
    @State private var model = LoginModel()
    @State private var isShowingPasswordReset = false
    @FocusState private var isIdentifierFocused: Bool
    @FocusState private var isPasswordFocused: Bool

    var body: some View {
        VStack(spacing: 24) {
            AuthHeader(subtitle: "Inicia sesión para ver tus tableros.")

            if !auth.recentAccounts.accounts.isEmpty {
                RecentAccountsList(
                    accounts: auth.recentAccounts.accounts,
                    currentAccountID: auth.currentProfile?.id,
                    openingAccountID: model.openingAccountID,
                    onOpen: open,
                    onRemove: remove
                )
                OrSeparator(text: "o entra con otra cuenta")
            }

            VStack(spacing: 14) {
                FormField(
                    title: "Correo o nickname",
                    text: $model.identifier,
                    prompt: "tu@correo.com o @nickname",
                    focus: $isIdentifierFocused
                )

                FormField(
                    title: "Contraseña",
                    text: $model.password,
                    prompt: "Contraseña",
                    isSecure: true,
                    focus: $isPasswordFocused
                ) {
                    Button("¿Olvidaste la contraseña?", action: showPasswordReset)
                        .buttonStyle(.textLink)
                }

                if let failure = model.failure ?? auth.notice {
                    FieldMessageView(message: .error(failure.message))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                PrimaryFormButton(title: "Iniciar sesión", isWorking: model.isSubmitting, action: signIn)
                    .disabled(!model.canSubmit)
            }
            .onSubmit(signIn)

            HStack(spacing: 4) {
                Text("¿No tienes cuenta?")
                    .foregroundStyle(Color.textSecondary)
                Button("Crear una cuenta", action: onCreateAccount)
                    .buttonStyle(.textLink)
            }
            .font(.body)
        }
        .frame(width: 360)
        .defaultFocus($isIdentifierFocused, true)
        .sheet(isPresented: $isShowingPasswordReset) {
            ForgotPasswordSheet(initialEmail: model.identifier.contains("@") && !model.identifier.hasPrefix("@") ? model.identifier : "")
        }
    }

    private func signIn() {
        auth.dismissNotice()
        Task {
            await model.signIn(using: auth)
            if model.failure != nil {
                isPasswordFocused = true
            }
        }
    }

    private func open(_ account: RecentAccount) {
        auth.dismissNotice()
        Task {
            if await model.open(account, using: auth) {
                isPasswordFocused = true
            }
        }
    }

    private func remove(_ account: RecentAccount) {
        auth.recentAccounts.remove(account.id)
    }

    private func showPasswordReset() {
        isShowingPasswordReset = true
    }
}
