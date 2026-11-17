"use client";

import { useRef, useState } from "react";
import { boardRepository, type Board, type BoardDraft, type BoardSummary } from "@/lib/data/boards";
import { DataFailureError, dataFailureMessage } from "@/lib/data/dataFailure";
import { listRepository, type BoardList, type BoardListStyle, LIST_NAME_MAX_LENGTH } from "@/lib/data/lists";
import { positionAfter, positionAt } from "@/lib/data/position";
import { taskRepository, type BoardTask, type TaskDraft } from "@/lib/data/tasks";
import type { PaletteColor } from "@/lib/palette";
import { createClient } from "@/lib/supabase/client";

export type TasksByList = Record<string, BoardTask[]>;

export function groupTasks(lists: BoardList[], tasks: BoardTask[]): TasksByList {
  const grouped: TasksByList = Object.fromEntries(lists.map((list) => [list.id, []]));
  for (const task of tasks) grouped[task.listId]?.push(task);
  for (const listTasks of Object.values(grouped)) listTasks.sort((a, b) => a.position - b.position);
  return grouped;
}

/**
 * State that also lives in a ref, so event handlers (drag and drop) read the latest value
 * right after changing it, without waiting for a render.
 */
function useStateWithRef<T>(initial: T) {
  const [state, setState] = useState(initial);
  const ref = useRef(initial);
  const set = (next: T | ((current: T) => T)) => {
    ref.current = typeof next === "function" ? (next as (current: T) => T)(ref.current) : next;
    setState(ref.current);
  };
  return [state, set, ref] as const;
}

/**
 * An open board with its lists and tasks: creating, editing, moving and deleting them,
 * and editing the board itself. Same behavior as `BoardModel` on macOS: changes are shown
 * right away and saved afterwards; if saving fails, the board reloads to match the
 * database and the error is shown.
 */
export function useBoard(initial: { board: Board; lists: BoardList[]; tasks: BoardTask[] }) {
  const [repositories] = useState(() => {
    const supabase = createClient();
    return { boards: boardRepository(supabase), lists: listRepository(supabase), tasks: taskRepository(supabase) };
  });
  const [board, setBoard] = useState(initial.board);
  const [lists, setLists, listsRef] = useStateWithRef(initial.lists);
  const [tasksByList, setTasksByList, tasksRef] = useStateWithRef(groupTasks(initial.lists, initial.tasks));
  /** A change that could not be saved. */
  const [actionError, setActionError] = useState<string | null>(null);

  const summary: BoardSummary = {
    listCount: lists.length,
    taskCount: Object.values(tasksByList).reduce((total, listTasks) => total + listTasks.length, 0),
  };

  const findTask = (taskId: string) => Object.values(tasksRef.current).flat().find((task) => task.id === taskId);
  const updateList = (listId: string, change: Partial<BoardList>) =>
    setLists((current) => current.map((list) => (list.id === listId ? { ...list, ...change } : list)));
  const replaceTask = (task: BoardTask) =>
    setTasksByList((current) => ({
      ...current,
      [task.listId]: (current[task.listId] ?? []).map((item) => (item.id === task.id ? task : item)),
    }));

  async function reload() {
    try {
      const [freshBoard, freshLists] = await Promise.all([
        repositories.boards.fetchBoard(board.id),
        repositories.lists.fetchLists(board.id),
      ]);
      const freshTasks = await repositories.tasks.fetchTasks(freshLists.map((list) => list.id));
      if (freshBoard) setBoard(freshBoard);
      setLists(freshLists);
      setTasksByList(groupTasks(freshLists, freshTasks));
    } catch {
      // The error of the change is already shown.
    }
  }

  /** Saves a change already shown on screen; if it fails, reloads and shows the error. */
  function persist(save: () => Promise<unknown>) {
    setActionError(null);
    save().catch((failure: unknown) => {
      setActionError(failure instanceof DataFailureError ? failure.message : dataFailureMessage("unexpected"));
      void reload();
    });
  }

  // ─── Lists ────────────────────────────────────────────

  /** Adds a list at the end of the board. Errors are shown in the modal. */
  async function createList(name: string, style: BoardListStyle) {
    const last = listsRef.current.at(-1);
    const list = await repositories.lists.create({
      boardId: board.id,
      name,
      style,
      position: positionAfter(last?.position ?? null),
    });
    setLists((current) => [...current, list]);
    setTasksByList((current) => ({ ...current, [list.id]: [] }));
  }

  function renameList(listId: string, name: string) {
    const trimmed = name.trim();
    const current = listsRef.current.find((list) => list.id === listId);
    if (!current || !trimmed || Array.from(trimmed).length > LIST_NAME_MAX_LENGTH || trimmed === current.name) return;
    updateList(listId, { name: trimmed });
    persist(() => repositories.lists.rename(listId, trimmed));
  }

  function setListStyle(listId: string, style: BoardListStyle) {
    const current = listsRef.current.find((list) => list.id === listId);
    if (!current || current.style === style) return;
    updateList(listId, { style });
    persist(() => repositories.lists.setStyle(listId, style));
  }

  /** Moves a list to `toIndex` (drag and drop) and saves its new position. */
  function moveList(listId: string, toIndex: number) {
    const order = [...listsRef.current];
    const fromIndex = order.findIndex((list) => list.id === listId);
    if (fromIndex === -1 || fromIndex === toIndex) return;
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    const position = positionAt(order, toIndex);
    order[toIndex] = { ...moved, position };
    setLists(order);
    persist(() => repositories.lists.setPosition(listId, position));
  }

  /** Deletes a list after its confirmation dialog. Errors are shown in the dialog. */
  async function deleteList(listId: string) {
    await repositories.lists.delete(listId);
    setLists((current) => current.filter((list) => list.id !== listId));
    setTasksByList((current) => {
      const next = { ...current };
      delete next[listId];
      return next;
    });
  }

  // ─── Tasks ────────────────────────────────────────────

  /** Adds a task at the end of a list. Errors are shown in the field. */
  async function addTask(listId: string, name: string) {
    const last = tasksRef.current[listId]?.at(-1);
    const task = await repositories.tasks.create({ listId, name, position: positionAfter(last?.position ?? null) });
    setTasksByList((current) => ({ ...current, [listId]: [...(current[listId] ?? []), task] }));
  }

  /** Saves the task modal. Errors are shown in the modal. */
  async function updateTask(taskId: string, draft: TaskDraft) {
    replaceTask(await repositories.tasks.update(taskId, draft));
  }

  function setTaskColor(taskId: string, color: PaletteColor | null) {
    const task = findTask(taskId);
    if (!task || task.color === color) return;
    replaceTask({ ...task, color });
    persist(() => repositories.tasks.setColor(taskId, color));
  }

  /**
   * Shows a dragged task in another place without saving it yet (while dragging):
   * in `listId`, at `index`.
   */
  function previewTaskMove(taskId: string, listId: string, index: number) {
    const task = findTask(taskId);
    if (!task) return;
    setTasksByList((current) => {
      const next = { ...current };
      next[task.listId] = (next[task.listId] ?? []).filter((item) => item.id !== taskId);
      const target = [...(next[listId] ?? [])];
      target.splice(Math.min(index, target.length), 0, { ...task, listId });
      next[listId] = target;
      return next;
    });
  }

  /** Saves the place where a dragged task was dropped, compared with where it started. */
  function commitTaskMove(taskId: string, origin: { listId: string; position: number }) {
    const task = findTask(taskId);
    if (!task) return;
    const listTasks = tasksRef.current[task.listId] ?? [];
    const index = listTasks.findIndex((item) => item.id === taskId);
    const isSamePlace =
      task.listId === origin.listId &&
      (index === 0 || listTasks[index - 1].position < origin.position) &&
      (index === listTasks.length - 1 || listTasks[index + 1].position > origin.position);
    if (isSamePlace) {
      // Back where it was: keep its position.
      replaceTask({ ...task, position: origin.position });
      return;
    }
    const position = positionAt(listTasks, index);
    replaceTask({ ...task, position });
    persist(() => repositories.tasks.move(taskId, task.listId, position));
  }

  /** Deletes a task after its confirmation dialog. Errors are shown in the dialog. */
  async function deleteTask(taskId: string) {
    const task = findTask(taskId);
    if (!task) return;
    await repositories.tasks.delete(taskId);
    setTasksByList((current) => ({
      ...current,
      [task.listId]: (current[task.listId] ?? []).filter((item) => item.id !== taskId),
    }));
  }

  // ─── Board ────────────────────────────────────────────

  /** Saves the board settings modal. Errors are shown in the modal. */
  async function updateBoard(draft: BoardDraft) {
    setBoard(await repositories.boards.update(board.id, draft));
  }

  function toggleFavorite() {
    const isFavorite = !board.isFavorite;
    setBoard((current) => ({ ...current, isFavorite }));
    persist(() => repositories.boards.setFavorite(board.id, isFavorite));
  }

  async function deleteBoard() {
    await repositories.boards.delete(board.id);
  }

  return {
    board,
    lists,
    tasksByList,
    summary,
    actionError,
    dismissActionError: () => setActionError(null),
    /** Latest tasks, for drag and drop handlers. */
    tasksRef,
    /** Puts the tasks back as they were (a canceled drag). */
    restoreTasks: (snapshot: TasksByList) => setTasksByList(snapshot),
    findTask,
    createList,
    renameList,
    setListStyle,
    moveList,
    deleteList,
    addTask,
    updateTask,
    setTaskColor,
    previewTaskMove,
    commitTaskMove,
    deleteTask,
    updateBoard,
    toggleFavorite,
    deleteBoard,
  };
}

export type BoardController = ReturnType<typeof useBoard>;
