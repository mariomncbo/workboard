import SwiftUI

/// "Cuentas recientes" box of the Login screen.
struct RecentAccountsList: View {
    let accounts: [RecentAccount]
    let currentAccountID: UUID?
    let openingAccountID: UUID?
    let onOpen: (RecentAccount) -> Void
    let onRemove: (RecentAccount) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Cuentas recientes")
                .font(.subheadline.weight(.semibold))
                .textCase(.uppercase)
                .tracking(0.4)
                .foregroundStyle(Color.textTertiary)
                .padding(.horizontal, 10)
                .padding(.top, 6)
                .padding(.bottom, 4)
                .accessibilityAddTraits(.isHeader)

            ForEach(accounts) { account in
                RecentAccountRow(
                    account: account,
                    isCurrent: account.id == currentAccountID,
                    isOpening: account.id == openingAccountID
                ) {
                    onOpen(account)
                }
                .contextMenu {
                    Button("Quitar de cuentas recientes", systemImage: "minus.circle") {
                        onRemove(account)
                    }
                    .disabled(account.id == currentAccountID)
                }
            }
        }
        .padding(6)
        .background(Color.bgComponent, in: .rect(cornerRadius: Radius.sm))
        .overlay {
            RoundedRectangle(cornerRadius: Radius.sm)
                .strokeBorder(Color.borderSubtle, lineWidth: 1)
        }
    }
}
