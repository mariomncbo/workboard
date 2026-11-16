import SwiftUI

/// "Perfil": change the name (and so the initials) and the nickname.
struct ProfileModal: View {
    let onClose: () -> Void

    @Environment(AuthService.self) private var auth
    @State private var model: ProfileModel
    @FocusState private var isNameFocused: Bool

    init(profile: Profile, onClose: @escaping () -> Void) {
        self.onClose = onClose
        _model = State(initialValue: ProfileModel(profile: profile))
    }

    var body: some View {
        ModalCard(width: 400) {
            ModalHeader(title: "Perfil", onClose: onClose)

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
                focus: $isNameFocused
            )

            FormField(title: "Nickname", text: $model.nickname, message: model.nicknameMessage) {
                NicknameStatusLabel(status: model.nicknameStatus)
            }

            if let failure = model.failure {
                FieldMessageView(message: .error(failure.message))
            }

            HStack(spacing: Spacing.s2) {
                Spacer()
                Button("Cancelar", action: onClose)
                    .buttonStyle(.content(.secondary))
                    .keyboardShortcut(.cancelAction)
                Button("Guardar", action: save)
                    .buttonStyle(.content(.primary))
                    .keyboardShortcut(.defaultAction)
                    .disabled(!model.hasChanges || model.isSaving)
            }
        }
        .defaultFocus($isNameFocused, true)
        .onSubmit(save)
        .task(id: model.normalizedNickname) {
            await model.checkNickname(using: auth)
        }
    }

    private func save() {
        guard model.hasChanges else { return }
        Task {
            if await model.save(using: auth) {
                onClose()
            }
        }
    }
}
