import SwiftUI

/// The editable part of a `FormField`: a plain text field or a secure field.
struct FormFieldInput: View {
    let title: LocalizedStringKey
    @Binding var text: String
    let prompt: LocalizedStringKey?
    let isSecure: Bool

    var body: some View {
        Group {
            if isSecure {
                SecureField(title, text: $text, prompt: promptText)
            } else {
                TextField(title, text: $text, prompt: promptText)
            }
        }
        .textFieldStyle(.plain)
        .font(.body)
        .foregroundStyle(Color.textPrimary)
    }

    private var promptText: Text? {
        prompt.map { Text($0).foregroundStyle(Color.textTertiary) }
    }
}
