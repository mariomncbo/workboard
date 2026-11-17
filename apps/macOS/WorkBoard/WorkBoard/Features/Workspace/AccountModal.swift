/// Account modals, available from the user menu on every signed-in screen.
enum AccountModal: String, Identifiable {
    case profile

    var id: Self { self }
}
