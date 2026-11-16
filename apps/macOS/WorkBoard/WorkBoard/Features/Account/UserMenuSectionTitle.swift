import SwiftUI

/// Small uppercase title inside the user menu, such as "Cambiar de cuenta".
struct UserMenuSectionTitle: View {
    let title: LocalizedStringKey

    var body: some View {
        Text(title)
            .font(.subheadline.weight(.semibold))
            .textCase(.uppercase)
            .tracking(0.4)
            .foregroundStyle(Color.textTertiary)
            .padding(.horizontal, 10)
            .padding(.top, Spacing.s2)
            .padding(.bottom, Spacing.s1)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isHeader)
    }
}
