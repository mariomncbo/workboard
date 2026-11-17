import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaletteColor } from "@/lib/palette";
import { toDataFailure } from "./dataFailure";

export const TASK_NAME_MAX_LENGTH = 500;
export const TASK_DESCRIPTION_MAX_LENGTH = 10000;

/** A task inside a list (`board_tasks` table). */
export type BoardTask = {
  id: string;
  listId: string;
  name: string;
  description: string | null;
  /** `null` means no color: the task takes the field color of its list. */
  color: PaletteColor | null;
  /** Fractional position inside its list. */
  position: number;
};

/** Editable fields of a task, saved from the task modal. */
export type TaskDraft = { name: string; description: string; color: PaletteColor | null };

export function draftFromTask(task: BoardTask): TaskDraft {
  return { name: task.name, description: task.description ?? "", color: task.color };
}

export function isTaskDraftValid(draft: TaskDraft): boolean {
  const name = draft.name.trim();
  return (
    name.length > 0 &&
    Array.from(name).length <= TASK_NAME_MAX_LENGTH &&
    Array.from(draft.description).length <= TASK_DESCRIPTION_MAX_LENGTH
  );
}

/** Task names are one paragraph: line breaks become spaces. */
export function cleanTaskName(text: string): string {
  return text.split(/\r?\n/).join(" ").trim();
}

type TaskRow = {
  id: string;
  list_id: string;
  name: string;
  description: string | null;
  color: PaletteColor | null;
  position: number;
};

const TASK_COLUMNS = "id, list_id, name, description, color, position";

function toTask(row: TaskRow): BoardTask {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    description: row.description,
    color: row.color,
    position: row.position,
  };
}

function draftToRow(draft: TaskDraft) {
  const description = draft.description.trim();
  // An empty description and "no color" are stored as null.
  return { name: draft.name.trim(), description: description || null, color: draft.color };
}

/** Reads and writes tasks of the signed-in user's lists (Row Level Security applies). */
export function taskRepository(supabase: SupabaseClient) {
  return {
    /** Tasks of the given lists, in order. */
    async fetchTasks(listIds: string[]): Promise<BoardTask[]> {
      if (listIds.length === 0) return [];
      const { data, error } = await supabase
        .from("board_tasks")
        .select(TASK_COLUMNS)
        .in("list_id", listIds)
        .order("position");
      if (error) throw toDataFailure(error);
      return (data as TaskRow[]).map(toTask);
    },

    async create(task: { listId: string; name: string; position: number }): Promise<BoardTask> {
      const { data, error } = await supabase
        .from("board_tasks")
        .insert({ list_id: task.listId, name: task.name, position: task.position })
        .select(TASK_COLUMNS)
        .single();
      if (error) throw toDataFailure(error);
      return toTask(data as TaskRow);
    },

    async update(taskId: string, draft: TaskDraft): Promise<BoardTask> {
      const { data, error } = await supabase
        .from("board_tasks")
        .update(draftToRow(draft))
        .eq("id", taskId)
        .select(TASK_COLUMNS)
        .single();
      if (error) throw toDataFailure(error);
      return toTask(data as TaskRow);
    },

    async setColor(taskId: string, color: PaletteColor | null): Promise<void> {
      const { error } = await supabase.from("board_tasks").update({ color }).eq("id", taskId);
      if (error) throw toDataFailure(error);
    },

    /** Puts the task in a list at a position (drag and drop). */
    async move(taskId: string, listId: string, position: number): Promise<void> {
      const { error } = await supabase.from("board_tasks").update({ list_id: listId, position }).eq("id", taskId);
      if (error) throw toDataFailure(error);
    },

    async delete(taskId: string): Promise<void> {
      const { error } = await supabase.from("board_tasks").delete().eq("id", taskId);
      if (error) throw toDataFailure(error);
    },
  };
}
