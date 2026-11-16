import SwiftUI

@main
struct WorkBoardApp: App {
    @State private var setup = AppSetup.make()

    var body: some Scene {
        WindowGroup {
            Group {
                switch setup {
                case .ready(let auth):
                    RootView()
                        .environment(auth)
                case .misconfigured(let message):
                    ConfigurationErrorView(message: message)
                }
            }
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
