import type { SupabaseClient } from "@supabase/supabase-js";
import { toDataFailure } from "./dataFailure";

export type BoardListStyle = "light" | "dark";

export const LIST_STYLES: readonly BoardListStyle[] = ["light", "dark"];

export const LIST_STYLE_NAMES: Record<BoardListStyle, string> = {
  light: "Blanco",
  dark: "Negro",
};

export const LIST_NAME_MAX_LENGTH = 100;

/** A list inside a board (`board_lists` table). */
export type BoardList = {
  id: string;
  boardId: string;
  name: string;
  style: BoardListStyle;
  /** Fractional position: lists are sorted by it, and moving one only changes its own value. */
  position: number;
};

type ListRow = { id: string; board_id: string; name: string; style: BoardListStyle; position: number };

const LIST_COLUMNS = "id, board_id, name, style, position";

function toList(row: ListRow): BoardList {
  return { id: row.id, boardId: row.board_id, name: row.name, style: row.style, position: row.position };
}

/** Reads and writes the lists of the signed-in user's boards (Row Level Security applies). */
export function listRepository(supabase: SupabaseClient) {
  async function update(listId: string, changes: Partial<ListRow>) {
    const { error } = await supabase.from("board_lists").update(changes).eq("id", listId);
    if (error) throw toDataFailure(error);
  }

  return {
    /** Lists of a board, in order. */
    async fetchLists(boardId: string): Promise<BoardList[]> {
      const { data, error } = await supabase
        .from("board_lists")
        .select(LIST_COLUMNS)
        .eq("board_id", boardId)
        .order("position");
      if (error) throw toDataFailure(error);
      return (data as ListRow[]).map(toList);
    },

    async create(list: { boardId: string; name: string; style: BoardListStyle; position: number }): Promise<BoardList> {
      const { data, error } = await supabase
        .from("board_lists")
        .insert({ board_id: list.boardId, name: list.name, style: list.style, position: list.position })
        .select(LIST_COLUMNS)
        .single();
      if (error) throw toDataFailure(error);
      return toList(data as ListRow);
    },

    rename: (listId: string, name: string) => update(listId, { name }),
    setStyle: (listId: string, style: BoardListStyle) => update(listId, { style }),
    setPosition: (listId: string, position: number) => update(listId, { position }),

    /** Inserts deleted lists again with the same identifiers and data (undo). */
    async restore(lists: BoardList[]): Promise<void> {
      if (lists.length === 0) return;
      const rows = lists.map((list) => ({
        id: list.id,
        board_id: list.boardId,
        name: list.name,
        style: list.style,
        position: list.position,
      }));
      const { error } = await supabase.from("board_lists").insert(rows);
      if (error) throw toDataFailure(error);
    },

    /** Deletes the list; the database deletes its tasks. */
    async delete(listId: string): Promise<void> {
      const { error } = await supabase.from("board_lists").delete().eq("id", listId);
      if (error) throw toDataFailure(error);
    },
  };
}
