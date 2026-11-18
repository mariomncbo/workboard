import SwiftUI

/// "4 listas · 23 tareas", or "Sin listas" for a new board.
struct BoardSummaryText: View {
    let summary: BoardSummary

    var body: some View {
        if summary.listCount == 0 {
            Text("Sin listas")
        } else {
            Text(verbatim: "\(CountText.lists(summary.listCount)) · \(CountText.tasks(summary.taskCount))")
        }
    }
}
