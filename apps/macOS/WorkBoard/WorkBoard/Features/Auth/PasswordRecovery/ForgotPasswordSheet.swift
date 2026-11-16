import SwiftUI

/// Asks for the account email and sends a link to choose a new password.
struct ForgotPasswordSheet: View {
    @Environment(AuthService.self) private var auth
    @Environment(\.dismiss) private var dismiss
    @State private var model: ForgotPasswordModel

    init(initialEmail: String) {
        _model = State(initialValue: ForgotPasswordModel(email: initialEmail))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Recuperar contraseña")
                .font(.modalTitle)
                .foregroundStyle(Color.textPrimary)

            if model.didSend {
                Text("Si hay una cuenta con ese correo, te llegará un enlace para elegir una contraseña nueva. Ábrelo en este Mac.")
                    .font(.callout)
                    .foregroundStyle(Color.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)

                HStack {
                    Spacer()
                    Button("Hecho", action: close)
                        .buttonStyle(.content(.primary))
                        .keyboardShortcut(.defaultAction)
                }
            } else {
                Text("Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.")
                    .font(.callout)
                    .foregroundStyle(Color.textSecondary)
                    .fixedSize(horizontal: false, vertical: true)

                FormField(
                    title: "Correo",
                    text: $model.email,
                    prompt: "tu@correo.com",
                    message: model.failure.map { .error($0.message) }
                )
                .onSubmit(send)

                HStack(spacing: Spacing.s2) {
                    Spacer()
                    Button("Cancelar", action: close)
                        .buttonStyle(.content(.secondary))
                        .keyboardShortcut(.cancelAction)
                    Button("Enviar enlace", action: send)
                        .buttonStyle(.content(.primary))
                        .keyboardShortcut(.defaultAction)
                        .disabled(!model.canSend)
                }
            }
        }
        .padding(Spacing.s5)
        .frame(width: 400)
        .presentationBackground(Color.bgComponent)
    }

    private func send() {
        Task {
            await model.send(using: auth)
        }
    }

    private func close() {
        dismiss()
    }
}
