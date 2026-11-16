import SwiftUI

/// Content buttons of the design system, for modals and panels (24 pt, compact Mac size).
///
/// Glass buttons are only for the toolbar and the floating bar: use the native
/// `.glass` and `.glassProminent` styles there.
///
/// - `primary`: the single main action of a view. Add `.keyboardShortcut(.defaultAction)`.
/// - `secondary`: "Cancelar". Add `.keyboardShortcut(.cancelAction)`.
/// - `plain`: secondary options inside panels.
/// - `danger`: only inside a deletion confirmation. Never the default action.
struct ContentButtonStyle: ButtonStyle {
    enum Kind {
        case primary, secondary, plain, danger
    }

    let kind: Kind

    func makeBody(configuration: Configuration) -> some View {
        ContentButtonBody(configuration: configuration, kind: kind)
    }
}

extension ButtonStyle where Self == ContentButtonStyle {
    /// A design system content button: `.buttonStyle(.content(.primary))`.
    static func content(_ kind: ContentButtonStyle.Kind) -> Self {
        ContentButtonStyle(kind: kind)
    }
}

#Preview {
    VStack(alignment: .leading, spacing: Spacing.s3) {
        HStack(spacing: Spacing.s2) {
            Button("Cancelar") {}
                .buttonStyle(.content(.secondary))
            Button("Guardar") {}
                .buttonStyle(.content(.primary))
        }
        Button("Eliminar tarea…", systemImage: "trash") {}
            .buttonStyle(.content(.plain))
        Button("Eliminar tablero", role: .destructive) {}
            .buttonStyle(.content(.danger))
        Button("Guardar") {}
            .buttonStyle(.content(.primary))
            .disabled(true)
    }
    .padding(Spacing.s5)
    .background(Color.bgComponent)
}
