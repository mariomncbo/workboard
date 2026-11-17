/// Modals that can be open on a board.
enum BoardModal: String, Identifiable {
    case settings
    case createList

    var id: Self { self }
}
