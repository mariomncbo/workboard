import SwiftUI

/// Frame of a side panel on the left of the board (320 pt): title, close button and content.
/// The panel narrows the board instead of covering it.
struct BoardSidePanel<Content: View>: View {
    let panel: BoardPanel
    let onClose: () -> Void
    let content: Content

    init(panel: BoardPanel, onClose: @escaping () -> Void, @ViewBuilder content: () -> Content) {
        self.panel = panel
        self.onClose = onClose
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(panel.title)
                    .font(.modalTitle)
                    .foregroundStyle(Color.textPrimary)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                IconButton(title: "Cerrar \(Text(panel.title))", systemImage: "xmark", action: onClose)
            }
            .padding(.horizontal, Spacing.s5)
            .padding(.top, Spacing.s2)

            content
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(width: BoardPanel.width)
        .background {
            Color.bgSubtle
                .ignoresSafeArea()
        }
        .overlay(alignment: .trailing) {
            Rectangle()
                .fill(Color.borderSubtle)
                .frame(width: 1)
                .ignoresSafeArea()
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(panel.title))
    }
}
