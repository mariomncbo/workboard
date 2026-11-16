import SwiftUI

/// The app's Settings window (⌘,). There are no options yet.
struct SettingsView: View {
    var body: some View {
        ContentUnavailableView {
            Label("Próximamente", systemImage: "gearshape")
        } description: {
            Text("Aquí podrás ajustar WorkBoard a tu manera.")
        }
        .frame(width: 420, height: 260)
        .background(Color.bgPage)
        .preferredColorScheme(.dark)
    }
}
