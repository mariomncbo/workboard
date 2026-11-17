/// An action chosen in the menu bar. The screen that is showing performs it.
enum WorkspaceCommand: Equatable {
    case createBoard
    case findBoards
    case addList
    case toggleFavorite
    case showBoardSettings
    case deleteBoard
    case togglePanel(BoardPanel)
    case goHome
}
