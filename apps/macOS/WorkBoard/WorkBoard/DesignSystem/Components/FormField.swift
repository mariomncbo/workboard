import SwiftUI

/// Labeled text field of the design system (Login, Register and modals),
/// with an optional help or error message underneath and an optional accessory
/// at the end of the label row, such as "¿Olvidaste la contraseña?".
struct FormField<Accessory: View>: View {
    let title: LocalizedStringKey
    @Binding var text: String
    let prompt: LocalizedStringKey?
    let isSecure: Bool
    let message: FieldMessage?
    /// Lets the screen move focus to this field. When `nil`, the field tracks its own focus.
    let focus: FocusState<Bool>.Binding?
    let accessory: Accessory

    @FocusState private var ownFocus: Bool

    init(
        title: LocalizedStringKey,
        text: Binding<String>,
        prompt: LocalizedStringKey? = nil,
        isSecure: Bool = false,
        message: FieldMessage? = nil,
        focus: FocusState<Bool>.Binding? = nil,
        @ViewBuilder accessory: () -> Accessory
    ) {
        self.title = title
        _text = text
        self.prompt = prompt
        self.isSecure = isSecure
        self.message = message
        self.focus = focus
        self.accessory = accessory()
    }

    var body: some View {
        let isFocused = focus ?? $ownFocus

        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(.callout.weight(.medium))
                    .foregroundStyle(Color.textSecondary)
                Spacer(minLength: Spacing.s2)
                accessory
                    .font(.callout)
            }

            FormFieldInput(title: title, text: $text, prompt: prompt, isSecure: isSecure)
                .focused(isFocused)
                .padding(.horizontal, 10)
                .frame(height: ControlMetrics.fieldHeight)
                .background(Color.bgComponentActive, in: .rect(cornerRadius: Radius.xs))
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.xs)
                        .strokeBorder(message?.isError == true ? Color.dangerText : Color.border, lineWidth: 1)
                }
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.xs + 2)
                        .strokeBorder(Color.focusRing, lineWidth: 2)
                        .padding(-4)
                        .opacity(isFocused.wrappedValue ? 1 : 0)
                }
                .focusEffectDisabled()

            if let message {
                FieldMessageView(message: message)
            }
        }
    }
}

extension FormField where Accessory == EmptyView {
    init(
        title: LocalizedStringKey,
        text: Binding<String>,
        prompt: LocalizedStringKey? = nil,
        isSecure: Bool = false,
        message: FieldMessage? = nil,
        focus: FocusState<Bool>.Binding? = nil
    ) {
        self.init(
            title: title,
            text: text,
            prompt: prompt,
            isSecure: isSecure,
            message: message,
            focus: focus
        ) {
            EmptyView()
        }
    }
}

#Preview {
    @Previewable @State var name = "Lucía Ortega"
    @Previewable @State var nickname = "lortega"
    @Previewable @State var password = ""

    VStack(spacing: 14) {
        FormField(title: "Nombre y apellidos", text: $name)
        FormField(
            title: "Nickname",
            text: $nickname,
            message: .error("Ese nickname ya está en uso. Prueba con otro.")
        )
        FormField(
            title: "Contraseña",
            text: $password,
            prompt: "Contraseña",
            isSecure: true,
            message: .help("Mínimo 8 caracteres.")
        ) {
            Button("¿Olvidaste la contraseña?") {}
                .buttonStyle(.link)
        }
    }
    .frame(width: 340)
    .padding(Spacing.s5)
    .background(Color.bgComponent)
}
