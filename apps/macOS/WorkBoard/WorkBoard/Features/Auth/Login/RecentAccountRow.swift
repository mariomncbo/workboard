import SwiftUI

/// One account under "Cuentas recientes": avatar, name and nickname.
struct RecentAccountRow: View {
    let account: RecentAccount
    let isCurrent: Bool
    let isOpening: Bool
    let action: () -> Void

    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                AvatarView(fullName: account.fullName)

                VStack(alignment: .leading, spacing: 1) {
                    Text(verbatim: account.fullName)
                        .font(.headline)
                        .foregroundStyle(Color.textPrimary)
                    subtitle
                        .font(.subheadline)
                        .foregroundStyle(Color.textSecondary)
                }

                Spacer(minLength: Spacing.s2)

                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.textTertiary)
                    .opacity(isOpening ? 0 : 1)
                    .overlay {
                        if isOpening {
                            ProgressView()
                                .controlSize(.small)
                        }
                    }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, Spacing.s2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isHovered ? Color.bgComponentHover : .clear, in: .rect(cornerRadius: Radius.xs))
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .onHover { isHovered = $0 }
        .accessibilityLabel(Text("Entrar como \(account.fullName)"))
        .accessibilityValue(subtitle)
    }

    private var subtitle: Text {
        if isCurrent {
            Text("@\(account.nickname) · Sesión actual")
        } else if account.requiresPassword {
            Text("@\(account.nickname) · Pide contraseña")
        } else {
            Text(verbatim: "@\(account.nickname)")
        }
    }
}
