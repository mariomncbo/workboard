import SwiftUI

/// Small floating notice for a change that could not be saved, with a close button.
struct ErrorBanner: View {
    let message: LocalizedStringResource
    let onDismiss: () -> Void

    var body: some View {
        HStack(spacing: Spacing.s2) {
            Image(systemName: "exclamationmark.circle")
                .foregroundStyle(Color.dangerText)
                .accessibilityHidden(true)
            Text(message)
                .font(.callout)
                .foregroundStyle(Color.textPrimary)
            IconButton(title: "Cerrar", systemImage: "xmark", action: onDismiss)
        }
        .padding(.leading, Spacing.s3)
        .padding(.trailing, 6)
        .padding(.vertical, 6)
        .background(Color.bgComponent, in: .capsule)
        .overlay {
            Capsule()
                .strokeBorder(Color.border, lineWidth: 1)
        }
        .elevation(.menu)
        .accessibilityElement(children: .contain)
    }
}
