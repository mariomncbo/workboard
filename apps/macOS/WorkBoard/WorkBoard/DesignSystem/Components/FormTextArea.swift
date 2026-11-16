import SwiftUI

/// Multi-line version of `FormField`, for descriptions. Grows from 3 to 6 lines.
struct FormTextArea: View {
    let title: LocalizedStringKey
    /// Shown after the title in a lighter color, such as "(opcional)".
    var note: LocalizedStringKey?
    @Binding var text: String
    var prompt: LocalizedStringKey?

    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Text(title)
                    .font(.callout.weight(.medium))
                    .foregroundStyle(Color.textSecondary)
                if let note {
                    Text(note)
                        .font(.callout)
                        .foregroundStyle(Color.textTertiary)
                }
            }

            TextField(title, text: $text, prompt: prompt.map { Text($0).foregroundStyle(Color.textTertiary) }, axis: .vertical)
                .lineLimit(3...6)
                .textFieldStyle(.plain)
                .font(.body)
                .foregroundStyle(Color.textPrimary)
                .focused($isFocused)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.bgComponentActive, in: .rect(cornerRadius: Radius.xs))
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.xs)
                        .strokeBorder(Color.border, lineWidth: 1)
                }
                .overlay {
                    RoundedRectangle(cornerRadius: Radius.xs + 2)
                        .strokeBorder(Color.focusRing, lineWidth: 2)
                        .padding(-4)
                        .opacity(isFocused ? 1 : 0)
                }
                .focusEffectDisabled()
        }
    }
}
