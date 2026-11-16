import Foundation
import Supabase

/// Reads and writes the signed-in user's boards. Row Level Security limits every
/// query to the user's own rows, and new boards get the owner from the session.
final class BoardRepository: Sendable {
    private let client: SupabaseClient

    private static let boardColumns = "id, name, description, background, is_favorite, created_at"

    init(client: SupabaseClient) {
        self.client = client
    }

    func fetchBoards() async throws(DataFailure) -> [Board] {
        do {
            return try await client
                .from("boards")
                .select(Self.boardColumns)
                .execute()
                .value
        } catch {
            throw DataFailure(error)
        }
    }

    /// Number of lists and tasks per board.
    func fetchSummaries() async throws(DataFailure) -> [UUID: BoardSummary] {
        do {
            let summaries: [BoardSummary] = try await client
                .from("board_summaries")
                .select()
                .execute()
                .value
            return Dictionary(uniqueKeysWithValues: summaries.map { ($0.boardID, $0) })
        } catch {
            throw DataFailure(error)
        }
    }

    func create(_ draft: BoardDraft) async throws(DataFailure) -> Board {
        do {
            return try await client
                .from("boards")
                .insert(draft)
                .select(Self.boardColumns)
                .single()
                .execute()
                .value
        } catch {
            throw DataFailure(error)
        }
    }

    func update(_ boardID: UUID, with draft: BoardDraft) async throws(DataFailure) -> Board {
        do {
            return try await client
                .from("boards")
                .update(draft)
                .eq("id", value: boardID.uuidString)
                .select(Self.boardColumns)
                .single()
                .execute()
                .value
        } catch {
            throw DataFailure(error)
        }
    }

    func setFavorite(_ isFavorite: Bool, for boardID: UUID) async throws(DataFailure) {
        do {
            try await client
                .from("boards")
                .update(["is_favorite": isFavorite])
                .eq("id", value: boardID.uuidString)
                .execute()
        } catch {
            throw DataFailure(error)
        }
    }

    /// Deletes the board; the database deletes its lists and tasks.
    func delete(_ boardID: UUID) async throws(DataFailure) {
        do {
            try await client
                .from("boards")
                .delete()
                .eq("id", value: boardID.uuidString)
                .execute()
        } catch {
            throw DataFailure(error)
        }
    }
}
