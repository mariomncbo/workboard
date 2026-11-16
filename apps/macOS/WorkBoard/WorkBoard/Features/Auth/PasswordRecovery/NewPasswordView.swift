import SwiftUI

/// Opened from the password reset email: choose a new password and continue signed in.
struct NewPasswordView: View {
    @Environment(AuthService.self) private var auth
    @State private var model = NewPasswordModel()
    @FocusState private var isPasswordFocused: Bool

    var body: some View {
        AuthScreenLayout {
            VStack(spacing: 24) {
                AuthHeader(subtitle: "Elige una contraseña nueva para tu cuenta.")

                VStack(spacing: 14) {
                    FormField(
                        title: "Contraseña nueva",
                        text: $model.password,
                        isSecure: true,
                        message: model.passwordMessage,
                        focus: $isPasswordFocused
                    )

                    FormField(
                        title: "Confirmar contraseña",
                        text: $model.passwordConfirmation,
                        isSecure: true,
                        message: model.passwordConfirmationMessage
                    )

                    if let failure = model.failure {
                        FieldMessageView(message: .error(failure.message))
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    PrimaryFormButton(title: "Guardar contraseña", isWorking: model.isSaving, action: save)
                        .disabled(model.isSaving)
                }
                .onSubmit(save)

                Button("Cancelar", action: cancel)
                    .buttonStyle(.textLink)
                    .keyboardShortcut(.cancelAction)
            }
            .frame(width: 360)
            .defaultFocus($isPasswordFocused, true)
        }
    }

    private func save() {
        Task {
            await model.save(using: auth)
        }
    }

    private func cancel() {
        Task {
            await auth.cancelPasswordRecovery()
        }
    }
}
