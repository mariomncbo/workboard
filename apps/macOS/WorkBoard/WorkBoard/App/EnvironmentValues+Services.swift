import SwiftUI

extension EnvironmentValues {
    /// Boards of the signed-in user. Set once at launch by `WorkBoardApp`.
    @Entry var boardRepository: BoardRepository?
}
