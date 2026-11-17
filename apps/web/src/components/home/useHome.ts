"use client";

import { useState } from "react";
import { useSaveQueue, useStateWithRef } from "@/components/board/useBoard";
import {
  EMPTY_SUMMARY,
  boardRepository,
  draftFromBoard,
  type Board,
  type BoardDraft,
  type BoardSummary,
} from "@/lib/data/boards";
import { listRepository, type BoardList } from "@/lib/data/lists";
import { taskRepository, type BoardTask } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/client";
import type { UndoManager } from "@/lib/undo";

/**
 * The user's boards on Home: creating, editing, starring and deleting them. Same behavior as
 * `HomeModel` on macOS: every change can be undone and redone, and a deleted board comes
 * back with its lists and tasks. Changes are shown right away and saved afterwards; if
 * saving fails, the boards reload and the error is shown.
 */
export function useHome(initial: { boards: Board[]; summaries: Record<string, BoardSummary> }, undo: UndoManager) {
  const [repositories] = useState(() => {
    const supabase = createClient();
    return { boards: boardRepository(supabase), lists: listRepository(supabase), tasks: taskRepository(supabase) };
  });
  const [boards, setBoards, boardsRef] = useStateWithRef(initial.boards);
  const [summaries, setSummaries] = useStateWithRef(initial.summaries);
  /** A change that could not be saved. */
  const [actionError, setActionError] = useState<string | null>(null);

  const persist = useSaveQueue((message) => {
    setActionError(message);
    void reload();
  });

  const findBoard = (boardId: string) => boardsRef.current.find((board) => board.id === boardId);
  const replace = (board: Board) => setBoards((current) => current.map((item) => (item.id === board.id ? board : item)));
  const summaryOf = (board: Board) => summaries[board.id] ?? EMPTY_SUMMARY;

  async function reload() {
    try {
      const [freshBoards, freshSummaries] = await Promise.all([
        repositories.boards.fetchBoards(),
        repositories.boards.fetchSummaries(),
      ]);
      setBoards(freshBoards);
      setSummaries(freshSummaries);
    } catch {
      // The error of the change is already shown.
    }
  }

  function removeLocally(boardId: string) {
    setBoards((current) => current.filter((board) => board.id !== boardId));
    setSummaries((current) => {
      const next = { ...current };
      delete next[boardId];
      return next;
    });
  }

  /** Saves the "Crear tablero" modal. Errors are shown in the modal. */
  async function createBoard(draft: BoardDraft) {
    const board = await repositories.boards.create(draft);
    setBoards((current) => [...current, board]);
    undo.register("Crear tablero", () => removeBoard(board.id, [], []));
  }

  /** Saves the board settings modal. Errors are shown in the modal. */
  async function updateBoard(boardId: string, draft: BoardDraft) {
    const current = findBoard(boardId);
    if (!current) return;
    replace(await repositories.boards.update(boardId, draft));
    undo.register("Configuración del tablero", () => applyDraft(boardId, draftFromBoard(current)));
  }

  /** Applies board settings without the modal, to undo or redo a change. */
  function applyDraft(boardId: string, draft: BoardDraft) {
    const current = findBoard(boardId);
    if (!current) return;
    const description = draft.description.trim();
    replace({
      ...current,
      name: draft.name.trim(),
      description: description || null,
      background: draft.background,
      isFavorite: draft.isFavorite,
    });
    undo.register("Configuración del tablero", () => applyDraft(boardId, draftFromBoard(current)));
    persist(() => repositories.boards.update(boardId, draft));
  }

  function toggleFavorite(boardId: string) {
    const current = findBoard(boardId);
    if (!current) return;
    const isFavorite = !current.isFavorite;
    replace({ ...current, isFavorite });
    undo.register(isFavorite ? "Añadir a favoritos" : "Quitar de favoritos", () => toggleFavorite(boardId));
    persist(() => repositories.boards.setFavorite(boardId, isFavorite));
  }

  /**
   * Deletes a board after its confirmation dialog. Its lists and tasks are kept in memory so
   * it can be brought back with ⌘Z. Errors are shown in the dialog.
   */
  async function deleteBoard(boardId: string) {
    const board = findBoard(boardId);
    if (!board) return;
    const lists = await repositories.lists.fetchLists(boardId);
    const tasks = await repositories.tasks.fetchTasks(lists.map((list) => list.id));
    await repositories.boards.delete(boardId);
    removeLocally(boardId);
    undo.register("Eliminar tablero", () => restoreBoard(board, lists, tasks));
  }

  /** Deletes a board without asking: undo of "Crear tablero" and redo of "Eliminar tablero". */
  function removeBoard(boardId: string, lists: BoardList[], tasks: BoardTask[]) {
    const board = findBoard(boardId);
    if (!board) return;
    removeLocally(boardId);
    undo.register("Eliminar tablero", () => restoreBoard(board, lists, tasks));
    persist(() => repositories.boards.delete(boardId));
  }

  /** Brings back a deleted board with its lists and tasks, with the same identifiers and data. */
  function restoreBoard(board: Board, lists: BoardList[], tasks: BoardTask[]) {
    if (findBoard(board.id)) return;
    setBoards((current) => [...current, board]);
    setSummaries((current) => ({ ...current, [board.id]: { listCount: lists.length, taskCount: tasks.length } }));
    undo.register("Eliminar tablero", () => removeBoard(board.id, lists, tasks));
    persist(async () => {
      await repositories.boards.restore(board);
      await repositories.lists.restore(lists);
      await repositories.tasks.restore(tasks);
    });
  }

  return {
    boards,
    summaryOf,
    actionError,
    dismissActionError: () => setActionError(null),
    createBoard,
    updateBoard,
    toggleFavorite,
    deleteBoard,
  };
}
