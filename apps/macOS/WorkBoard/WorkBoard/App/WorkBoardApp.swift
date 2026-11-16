import SwiftUI

@main
struct WorkBoardApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .frame(minWidth: WindowMetrics.minSize.width, minHeight: WindowMetrics.minSize.height)
                .preferredColorScheme(.dark)
        }
        .defaultSize(WindowMetrics.defaultSize)
        .windowResizability(.contentMinSize)
    }
}

/// Window sizes shared by every screen of the app.
enum WindowMetrics {
    static let defaultSize = CGSize(width: 1280, height: 800)
    static let minSize = CGSize(width: 900, height: 600)
}
