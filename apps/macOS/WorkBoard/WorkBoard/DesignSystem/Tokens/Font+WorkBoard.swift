import SwiftUI

// Typography of the design system. All styles are semantic system styles (SF Pro),
// so they follow the user's text settings. Use the system styles directly for:
// `.headline` (board, list and button names), `.body` (tasks, fields),
// `.callout` (help in modals) and `.subheadline` (metadata, nickname).

extension Font {
    /// Home and Login title ("Mi espacio de trabajo"). Token `largeTitle`.
    static let screenTitle = Font.largeTitle.bold()
    /// Name of the open board. Token `title`.
    static let boardTitle = Font.title.weight(.semibold)
    /// Modal and dialog titles. Token `title3`.
    static let modalTitle = Font.title3.weight(.semibold)
    /// Labels of content buttons and form fields.
    static let control = Font.body.weight(.medium)
    /// Number of tasks in a list. Token `count`.
    static let taskCount = Font.caption.monospacedDigit().weight(.medium)
}
