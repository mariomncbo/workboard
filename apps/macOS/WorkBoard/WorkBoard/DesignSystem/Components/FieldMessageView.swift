import SwiftUI

/// Help or error text under a `FormField`.
struct FieldMessageView: View {
    let message: FieldMessage

    var body: some View {
        switch message {
        case .help(let text):
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Color.textTertiary)
        case .error(let text):
            Label {
                Text(text)
            } icon: {
                Image(systemName: "exclamationmark.circle")
            }
            .font(.subheadline)
            .foregroundStyle(Color.dangerText)
        }
    }
}
