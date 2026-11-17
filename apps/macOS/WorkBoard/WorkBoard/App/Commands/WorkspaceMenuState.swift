/// What the menu bar needs to know about the screen that is showing, to enable,
/// disable and title its items.
struct WorkspaceMenuState: Equatable {
    enum Screen: Equatable {
        case home
        case board(isFavorite: Bool, openPanel: BoardPanel?)
    }

    let screen: Screen
    /// While a modal or confirmation is open, the menu actions are disabled.
    let isModalPresented: Bool

    var isHome: Bool {
        screen == .home && !isModalPresented
    }

    var isBoard: Bool {
        if case .board = screen { !isModalPresented } else { false }
    }

    var isFavoriteBoard: Bool {
        if case .board(let isFavorite, _) = screen { isFavorite } else { false }
    }

    var openPanel: BoardPanel? {
        if case .board(_, let openPanel) = screen { openPanel } else { nil }
    }
}
