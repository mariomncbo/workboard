/// What the board modal is used for.
enum BoardEditorMode {
    /// "Crear tablero": name, background and favorite.
    case create
    /// "Configuración del tablero": also description, content summary and delete.
    case settings(Board, BoardSummary)
}
