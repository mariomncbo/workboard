import type { SupabaseClient } from "@supabase/supabase-js";
import { BOARD_BACKGROUNDS, type BoardBackground } from "@/lib/palette";
import { toDataFailure } from "./dataFailure";

/** A board of the signed-in user (`boards` table). */
export type Board = {
  id: string;
  name: string;
  description: string | null;
  background: BoardBackground;
  /** Only used for sorting: favorites come first. */
  isFavorite: boolean;
  createdAt: string;
};

/** Number of lists and tasks of a board (`board_summaries` view). */
export type BoardSummary = { listCount: number; taskCount: number };

export const EMPTY_SUMMARY: BoardSummary = { listCount: 0, taskCount: 0 };

/** Editable fields of a board, to create it or save its settings. */
export type BoardDraft = {
  name: string;
  description: string;
  background: BoardBackground;
  isFavorite: boolean;
};

export const BOARD_NAME_MAX_LENGTH = 100;
export const BOARD_DESCRIPTION_MAX_LENGTH = 2000;

export const EMPTY_BOARD_DRAFT: BoardDraft = { name: "", description: "", background: "dots", isFavorite: false };

export function draftFromBoard(board: Board): BoardDraft {
  return {
    name: board.name,
    description: board.description ?? "",
    background: board.background,
    isFavorite: board.isFavorite,
  };
}

export function isBoardDraftValid(draft: BoardDraft): boolean {
  const name = draft.name.trim();
  return (
    name.length > 0 &&
    Array.from(name).length <= BOARD_NAME_MAX_LENGTH &&
    Array.from(draft.description).length <= BOARD_DESCRIPTION_MAX_LENGTH
  );
}

/** "4 listas · 23 tareas", or "Sin listas" for a new board. */
export function boardSummaryText({ listCount, taskCount }: BoardSummary): string {
  if (listCount === 0) return "Sin listas";
  const lists = listCount === 1 ? "1 lista" : `${listCount} listas`;
  const tasks = taskCount === 1 ? "1 tarea" : `${taskCount} tareas`;
  return `${lists} · ${tasks}`;
}

/** Message of the confirmation before deleting a board. */
export function boardDeletionMessage({ listCount, taskCount }: BoardSummary): string {
  if (listCount === 0) return "Se borrará el tablero. Esta acción no se puede deshacer.";
  const lists = listCount === 1 ? "su lista" : `sus ${listCount} listas`;
  const tasks = taskCount === 1 ? "su tarea" : `sus ${taskCount} tareas`;
  return `Se borrarán el tablero, ${lists} y ${tasks}. Esta acción no se puede deshacer.`;
}

/** Favorites first, then the newest; optionally filtered by name. */
export function sortAndFilterBoards(boards: Board[], query: string): Board[] {
  const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
  const needle = normalize(query.trim());
  const matching = needle ? boards.filter((board) => normalize(board.name).includes(needle)) : boards;
  return [...matching].sort((first, second) => {
    if (first.isFavorite !== second.isFavorite) return first.isFavorite ? -1 : 1;
    return second.createdAt.localeCompare(first.createdAt);
  });
}

// ─── Database ───────────────────────────────────────────────

const BOARD_COLUMNS = "id, name, description, background, is_favorite, created_at";

type BoardRow = {
  id: string;
  name: string;
  description: string | null;
  background: string;
  is_favorite: boolean;
  created_at: string;
};

function toBoard(row: BoardRow): Board {
  const background = (BOARD_BACKGROUNDS as readonly string[]).includes(row.background)
    ? (row.background as BoardBackground)
    : "dots"; // Unknown values from a newer version fall back to the default.
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    background,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
  };
}

function toRow(draft: BoardDraft) {
  const description = draft.description.trim();
  return {
    name: draft.name.trim(),
    // An empty description is stored as null.
    description: description || null,
    background: draft.background,
    is_favorite: draft.isFavorite,
  };
}

/**
 * Reads and writes the signed-in user's boards. Row Level Security limits every query to
 * the user's own rows, and new boards get the owner from the session.
 */
export function boardRepository(supabase: SupabaseClient) {
  return {
    async fetchBoards(): Promise<Board[]> {
      const { data, error } = await supabase.from("boards").select(BOARD_COLUMNS);
      if (error) throw toDataFailure(error);
      return (data as BoardRow[]).map(toBoard);
    },

    /** One board, or `null` when it does not exist or belongs to someone else. */
    async fetchBoard(boardId: string): Promise<Board | null> {
      const { data, error } = await supabase.from("boards").select(BOARD_COLUMNS).eq("id", boardId).maybeSingle();
      if (error) throw toDataFailure(error);
      return data ? toBoard(data as BoardRow) : null;
    },

    async fetchSummaries(): Promise<Record<string, BoardSummary>> {
      const { data, error } = await supabase.from("board_summaries").select("board_id, list_count, task_count");
      if (error) throw toDataFailure(error);
      return Object.fromEntries(
        data.map((row) => [row.board_id as string, { listCount: Number(row.list_count), taskCount: Number(row.task_count) }]),
      );
    },

    async create(draft: BoardDraft): Promise<Board> {
      const { data, error } = await supabase.from("boards").insert(toRow(draft)).select(BOARD_COLUMNS).single();
      if (error) throw toDataFailure(error);
      return toBoard(data as BoardRow);
    },

    async update(boardId: string, draft: BoardDraft): Promise<Board> {
      const { data, error } = await supabase
        .from("boards")
        .update(toRow(draft))
        .eq("id", boardId)
        .select(BOARD_COLUMNS)
        .single();
      if (error) throw toDataFailure(error);
      return toBoard(data as BoardRow);
    },

    async setFavorite(boardId: string, isFavorite: boolean): Promise<void> {
      const { error } = await supabase.from("boards").update({ is_favorite: isFavorite }).eq("id", boardId);
      if (error) throw toDataFailure(error);
    },

    /** Deletes the board; the database deletes its lists and tasks. */
    async delete(boardId: string): Promise<void> {
      const { error } = await supabase.from("boards").delete().eq("id", boardId);
      if (error) throw toDataFailure(error);
    },
  };
}
