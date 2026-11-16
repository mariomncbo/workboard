import SwiftUI

/// Presents a modal card centered over the dimmed content.
///
/// While it is shown, the content behind is disabled, so clicks, Tab and keyboard
/// shortcuts only reach the modal. Each modal answers Esc with a Cancel button that
/// uses `.keyboardShortcut(.cancelAction)`. Modals can be stacked: a deletion
/// confirmation applied outside another modal disables it too.
struct ModalOverlayModifier<Item: Identifiable, ModalContent: View>: ViewModifier {
    @Binding var item: Item?
    let modalContent: (Item) -> ModalContent

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func body(content: Content) -> some View {
        content
            .disabled(item != nil)
            .overlay {
                if let item {
                    ZStack {
                        Color.black.opacity(0.55)
                            .ignoresSafeArea()
                            .accessibilityHidden(true)
                        modalContent(item)
                            .transition(reduceMotion ? .opacity : .scale(scale: 0.97).combined(with: .opacity))
                    }
                    .transition(.opacity)
                }
            }
            .animation(.smooth(duration: 0.18), value: item?.id)
    }
}

extension View {
    /// Shows a centered modal card while `item` is not `nil`. Set it to `nil` to close it.
    func modal<Item: Identifiable, ModalContent: View>(
        item: Binding<Item?>,
        @ViewBuilder content: @escaping (Item) -> ModalContent
    ) -> some View {
        modifier(ModalOverlayModifier(item: item, modalContent: content))
    }
}
