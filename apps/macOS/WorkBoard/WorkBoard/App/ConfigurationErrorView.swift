import SwiftUI

/// Shown instead of the app when the Supabase configuration cannot be loaded.
struct ConfigurationErrorView: View {
    let message: String

    var body: some View {
        ContentUnavailableView {
            Label("Falta la configuración de Supabase", systemImage: "exclamationmark.triangle")
        } description: {
            Text(message)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPage)
    }
}
