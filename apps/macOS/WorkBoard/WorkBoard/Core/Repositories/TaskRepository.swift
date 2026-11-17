import Foundation
import Supabase

/// Reads and writes tasks. Row Level Security only lets the user touch tasks of their
/// own lists, including when moving a task to another list.
final class TaskRepository: Sendable {
    private let client: SupabaseClient

    private static let taskColumns = "id, list_id, name, description, color, position"

    init(client: SupabaseClient) {
        self.client = client
    }

    /// Tasks of the given lists, in order.
    func fetchTasks(inLists listIDs: [UUID]) async throws(DataFailure) -> [BoardTask] {
        guard !listIDs.isEmpty else { return [] }
        do {
            return try await client
                .from("board_tasks")
                .select(Self.taskColumns)
                .in("list_id", values: listIDs.map(\.uuidString))
                .order("position")
                .execute()
                .value
        } catch {
            throw DataFailure(error)
        }
    }

    func create(_ task: NewBoardTask) async throws(DataFailure) -> BoardTask {
        do {
            return try await client
                .from("board_tasks")
                .insert(task)
                .select(Self.taskColumns)
                .single()
                .execute()
                .value
        } catch {
            throw DataFailure(error)
        }
    }

    func update(_ taskID: UUID, with draft: TaskDraft) async throws(DataFailure) -> BoardTask {
        do {
            return try await client
                .from("board_tasks")
                .update(draft)
                .eq("id", value: taskID.uuidString)
                .select(Self.taskColumns)
                .single()
                .execute()
                .value
        } catch {
            throw DataFailure(error)
        }
    }

    /// Moves a task within its list or to another list.
    func move(_ taskID: UUID, to placement: TaskPlacement) async throws(DataFailure) {
        do {
            try await client
                .from("board_tasks")
                .update(placement)
                .eq("id", value: taskID.uuidString)
                .execute()
        } catch {
            throw DataFailure(error)
        }
    }

    /// Inserts deleted tasks again with the same identifiers and data (undo).
    func restore(_ tasks: [BoardTask]) async throws(DataFailure) {
        guard !tasks.isEmpty else { return }
        do {
            try await client.from("board_tasks").insert(tasks).execute()
        } catch {
            throw DataFailure(error)
        }
    }

    func delete(_ taskID: UUID) async throws(DataFailure) {
        do {
            try await client
                .from("board_tasks")
                .delete()
                .eq("id", value: taskID.uuidString)
                .execute()
        } catch {
            throw DataFailure(error)
        }
    }
}
