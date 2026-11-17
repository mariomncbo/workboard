import SwiftUI

extension EnvironmentValues {
    /// Boards of the signed-in user. Set once at launch by `WorkBoardApp`.
    @Entry var boardRepository: BoardRepository?
    /// Lists of the user's boards. Set once at launch by `WorkBoardApp`.
    @Entry var listRepository: ListRepository?
}
