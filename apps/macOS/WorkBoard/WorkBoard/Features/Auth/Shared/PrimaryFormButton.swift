import SwiftUI

/// Full-width primary button at the end of an authentication form.
/// Shows a spinner while the request runs and answers to Return.
struct PrimaryFormButton: View {
    let title: LocalizedStringKey
    let isWorking: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .opacity(isWorking ? 0 : 1)
                .overlay {
                    if isWorking {
                        ProgressView()
                            .controlSize(.small)
                            .tint(Color.onAccent)
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 30)
        }
        .buttonStyle(.content(.primary))
        .keyboardShortcut(.defaultAction)
        .padding(.top, 4)
    }
}
