import Foundation
import Supabase

/// Reads and writes the lists of a board. Row Level Security only lets the user
/// touch lists of their own boards.
final class ListRepository: Sendable {
    private let client: SupabaseClient

    private static let listColumns = "id, board_id, name, style, position, board_tasks(count)"

    init(client: SupabaseClient) {
        self.client = client
    }

    /// Lists of a board, in order, each with its number of tasks.
    func fetchLists(of boardID: UUID) async throws(DataFailure) -> [BoardList] {
        do {
            return try await client
                .from("board_lists")
                .select(Self.listColumns)
                .eq("board_id", value: boardID.uuidString)
                .order("position")
                .execute()
                .value
        } catch {
            throw DataFailure(error)
        }
    }

    func create(_ list: NewBoardList) async throws(DataFailure) -> BoardList {
        do {
            return try await client
                .from("board_lists")
                .insert(list)
                .select(Self.listColumns)
                .single()
                .execute()
                .value
        } catch {
            throw DataFailure(error)
        }
    }

    func rename(_ listID: UUID, to name: String) async throws(DataFailure) {
        try await updateField("name", value: name, of: listID)
    }

    func setStyle(_ style: BoardListStyle, of listID: UUID) async throws(DataFailure) {
        try await updateField("style", value: style.rawValue, of: listID)
    }

    func setPosition(_ position: Double, of listID: UUID) async throws(DataFailure) {
        do {
            try await client
                .from("board_lists")
                .update(["position": position])
                .eq("id", value: listID.uuidString)
                .execute()
        } catch {
            throw DataFailure(error)
        }
    }

    /// Deletes the list; the database deletes its tasks.
    func delete(_ listID: UUID) async throws(DataFailure) {
        do {
            try await client
                .from("board_lists")
                .delete()
                .eq("id", value: listID.uuidString)
                .execute()
        } catch {
            throw DataFailure(error)
        }
    }

    private func updateField(_ column: String, value: String, of listID: UUID) async throws(DataFailure) {
        do {
            try await client
                .from("board_lists")
                .update([column: value])
                .eq("id", value: listID.uuidString)
                .execute()
        } catch {
            throw DataFailure(error)
        }
    }
}
