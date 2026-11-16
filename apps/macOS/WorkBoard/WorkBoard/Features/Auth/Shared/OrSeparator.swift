import SwiftUI

/// Horizontal rule with a short text in the middle: "o entra con otra cuenta".
struct OrSeparator: View {
    let text: LocalizedStringKey

    var body: some View {
        HStack(spacing: Spacing.s3) {
            line
            Text(text)
                .font(.callout)
                .foregroundStyle(Color.textTertiary)
                .fixedSize()
            line
        }
    }

    private var line: some View {
        Rectangle()
            .fill(Color.borderSubtle)
            .frame(height: 1)
    }
}
