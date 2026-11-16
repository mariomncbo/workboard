import SwiftUI

/// One option of the user menu, with a hover background and an optional shortcut or detail
/// on the right.
struct UserMenuRow<Leading: View>: View {
    let title: LocalizedStringKey
    var detail: Text?
    var isDestructive = false
    let leading: Leading
    let action: () -> Void

    @Environment(\.isEnabled) private var isEnabled
    @State private var isHovered = false

    init(
        _ title: LocalizedStringKey,
        detail: Text? = nil,
        isDestructive: Bool = false,
        action: @escaping () -> Void,
        @ViewBuilder leading: () -> Leading
    ) {
        self.title = title
        self.detail = detail
        self.isDestructive = isDestructive
        self.action = action
        self.leading = leading()
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                leading
                Text(title)
                    .foregroundStyle(isDestructive ? Color.dangerText : Color.textPrimary)
                Spacer(minLength: Spacing.s2)
                if let detail {
                    detail
                        .font(.callout)
                        .foregroundStyle(Color.textTertiary)
                }
            }
            .font(.body)
            .padding(.horizontal, 10)
            .frame(height: 30)
            .background(isHovered && isEnabled ? Color.bgComponentHover : .clear, in: .rect(cornerRadius: Radius.xs))
            .contentShape(.rect)
            .opacity(isEnabled ? 1 : 0.45)
        }
        .buttonStyle(.plain)
        .onHover { isHovered = $0 }
    }
}

extension UserMenuRow where Leading == EmptyView {
    init(
        _ title: LocalizedStringKey,
        detail: Text? = nil,
        isDestructive: Bool = false,
        action: @escaping () -> Void
    ) {
        self.init(title, detail: detail, isDestructive: isDestructive, action: action) {
            EmptyView()
        }
    }
}
