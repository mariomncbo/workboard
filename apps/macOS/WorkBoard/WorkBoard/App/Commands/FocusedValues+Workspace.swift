import SwiftUI

extension FocusedValues {
    /// The screen's pending menu command. The menu bar sets it; the screen performs it and
    /// clears it.
    @Entry var workspaceCommand: Binding<WorkspaceCommand?>?
    /// State of the screen, so the menu bar can enable and title its items.
    @Entry var workspaceMenuState: WorkspaceMenuState?
}
