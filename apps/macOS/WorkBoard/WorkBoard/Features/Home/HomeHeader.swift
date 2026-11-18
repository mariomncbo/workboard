import SwiftUI

/// "Mi espacio de trabajo" with the number of boards.
struct HomeHeader: View {
    let boardCount: Int

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text("Mi espacio de trabajo")
                .font(.screenTitle)
                .foregroundStyle(Color.textPrimary)
                .accessibilityAddTraits(.isHeader)
            Spacer()
            if boardCount > 0 {
                Text(verbatim: "\(CountText.boards(boardCount)) · favoritos primero")
                    .font(.callout)
                    .foregroundStyle(Color.textSecondary)
            }
        }
    }
}
