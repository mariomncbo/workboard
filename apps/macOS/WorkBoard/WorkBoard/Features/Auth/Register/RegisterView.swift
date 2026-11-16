import SwiftUI

/// Register: full name, email, nickname and password. The avatar is the initials.
struct RegisterView: View {
    let onSignIn: () -> Void

    @Environment(AuthService.self) private var auth
    @State private var model = RegisterModel()
    @FocusState private var isFullNameFocused: Bool

    var body: some View {
        VStack(spacing: 24) {
            AuthHeader(subtitle: "Crea tu cuenta. Tu espacio de trabajo estará listo en un momento.")

            VStack(spacing: 14) {
                HStack(spacing: Spacing.s3) {
                    AvatarView(fullName: model.fullName, size: .large)
                        .accessibilityHidden(true)
                    Text("Tu avatar son tus iniciales. Se generan a partir de tu nombre.")
                        .font(.subheadline)
                        .foregroundStyle(Color.textTertiary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                FormField(
                    title: "Nombre y apellidos",
                    text: $model.fullName,
                    message: model.fullNameMessage,
                    focus: $isFullNameFocused
                )

                FormField(
                    title: "Correo",
                    text: $model.email,
                    prompt: "tu@correo.com",
                    message: model.emailMessage
                )

                FormField(
                    title: "Nickname",
                    text: $model.nickname,
                    prompt: "lortega",
                    message: model.nicknameMessage
                ) {
                    NicknameStatusLabel(status: model.nicknameStatus)
                }

                FormField(
                    title: "Contraseña",
                    text: $model.password,
                    isSecure: true,
                    message: model.passwordMessage
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

                PrimaryFormButton(title: "Crear cuenta", isWorking: model.isSubmitting, action: signUp)
                    .disabled(model.isSubmitting)
            }
            .onSubmit(signUp)
            .padding(Spacing.s5)
            .background(Color.bgComponent, in: .rect(cornerRadius: Radius.sm))
            .overlay {
                RoundedRectangle(cornerRadius: Radius.sm)
                    .strokeBorder(Color.borderSubtle, lineWidth: 1)
            }

            HStack(spacing: 4) {
                Text("¿Ya tienes cuenta?")
                    .foregroundStyle(Color.textSecondary)
                Button("Iniciar sesión", action: onSignIn)
                    .buttonStyle(.textLink)
            }
            .font(.body)
        }
        .frame(width: 380)
        .defaultFocus($isFullNameFocused, true)
        .task(id: model.normalizedNickname) {
            await model.checkNickname(using: auth)
        }
    }

    private func signUp() {
        Task {
            await model.signUp(using: auth)
        }
    }
}
