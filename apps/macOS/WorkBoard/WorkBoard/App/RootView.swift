import SwiftUI

/// Top-level view of the window. It will decide which screen to show
/// (Login or Home) once authentication is in place.
struct RootView: View {
    var body: some View {
        Text("WorkBoard")
            .font(.largeTitle.bold())
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    RootView()
        .frame(width: 1280, height: 800)
        .preferredColorScheme(.dark)
}
