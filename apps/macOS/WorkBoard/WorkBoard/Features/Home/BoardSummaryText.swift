import SwiftUI

/// "4 listas · 23 tareas", or "Sin listas" for a new board.
struct BoardSummaryText: View {
    let summary: BoardSummary

    var body: some View {
        if summary.listCount == 0 {
            Text("Sin listas")
        } else {
            Text("^[\(summary.listCount) lista](inflect: true) · ^[\(summary.taskCount) tarea](inflect: true)")
        }
    }
}
