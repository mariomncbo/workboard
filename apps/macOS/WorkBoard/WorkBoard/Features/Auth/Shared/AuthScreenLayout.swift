import SwiftUI

/// Common frame of the authentication screens: animated background, content centered
/// in the window (scrollable when the window is short), GitHub and web links at the
/// bottom right, and a transparent title bar that keeps only the window buttons.
struct AuthScreenLayout<Content: View>: View {
    let content: Content

    @State private var viewportHeight = 0.0

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ScrollView {
            content
                .padding(.vertical, Spacing.s10)
                .frame(maxWidth: .infinity, minHeight: viewportHeight)
        }
        .scrollBounceBehavior(.basedOnSize)
        .onGeometryChange(for: Double.self) { proxy in
            proxy.size.height
        } action: { height in
            viewportHeight = height
        }
        .overlay(alignment: .bottomTrailing) {
            AuthFooterLinks()
                .padding(.trailing, Spacing.s5)
                .padding(.bottom, 16)
        }
        .appBackground()
        .toolbar(removing: .title)
        .toolbarBackgroundVisibility(.hidden, for: .windowToolbar)
    }
}
