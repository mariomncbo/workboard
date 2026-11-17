"use client";

import { useRef, useState } from "react";
import { boardRepository, type Board, type BoardDraft, type BoardSummary, draftFromBoard } from "@/lib/data/boards";
import { DataFailureError, dataFailureMessage } from "@/lib/data/dataFailure";
import { listRepository, type BoardList, type BoardListStyle, LIST_NAME_MAX_LENGTH } from "@/lib/data/lists";
import { positionAfter, positionAt } from "@/lib/data/position";
import { draftFromTask, taskRepository, type BoardTask, type TaskDraft } from "@/lib/data/tasks";
import type { PaletteColor } from "@/lib/palette";
import { createClient } from "@/lib/supabase/client";
import type { UndoManager } from "@/lib/undo";

export type TasksByList = Record<string, BoardTask[]>;

export function groupTasks(lists: BoardList[], tasks: BoardTask[]): TasksByList {
  const grouped: TasksByList = Object.fromEntries(lists.map((list) => [list.id, []]));
  for (const task of tasks) grouped[task.listId]?.push(task);
  for (const listTasks of Object.values(grouped)) listTasks.sort((a, b) => a.position - b.position);
  return grouped;
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

/**
 * State that also lives in a ref, so event handlers (drag and drop, undo) read the latest
 * value right after changing it, without waiting for a render.
 */
export function useStateWithRef<T>(initial: T) {
  const [state, setState] = useState(initial);
  const ref = useRef(initial);
  const set = (next: T | ((current: T) => T)) => {
    ref.current = typeof next === "function" ? (next as (current: T) => T)(ref.current) : next;
    setState(ref.current);
  };
  return [state, set, ref] as const;
}

/**
 * Saves changes already shown on screen one after another, in order (so an undo never
 * reaches the database before the change it reverses). If one fails, `onFailure` runs.
 */
export function useSaveQueue(onFailure: (message: string) => void) {
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  return (save: () => Promise<unknown>) => {
    queue.current = queue.current.then(save).catch((failure: unknown) => {
      onFailure(failure instanceof DataFailureError ? failure.message : dataFailureMessage("unexpected"));
    });
  };
}

/**
 * An open board with its lists and tasks: creating, editing, moving and deleting them,
 * and editing the board itself. Same behavior as `BoardModel` on macOS: every change can
 * be undone and redone; changes are shown right away and saved afterwards; if saving fails,
 * the board reloads to match the database and the error is shown.
 */
export function useBoard(initial: { board: Board; lists: BoardList[]; tasks: BoardTask[] }, undo: UndoManager) {
  const [repositories] = useState(() => {
    const supabase = createClient();
    return { boards: boardRepository(supabase), lists: listRepository(supabase), tasks: taskRepository(supabase) };
  });
  const [board, setBoard, boardRef] = useStateWithRef(initial.board);
  const [lists, setLists, listsRef] = useStateWithRef(initial.lists);
  const [tasksByList, setTasksByList, tasksRef] = useStateWithRef(groupTasks(initial.lists, initial.tasks));
  /** A change that could not be saved. */
  const [actionError, setActionError] = useState<string | null>(null);

  const persist = useSaveQueue((message) => {
    setActionError(message);
    void reload();
  });

  const summary: BoardSummary = {
    listCount: lists.length,
    taskCount: Object.values(tasksByList).reduce((total, listTasks) => total + listTasks.length, 0),
  };

  const findList = (listId: string) => listsRef.current.find((list) => list.id === listId);
  const findTask = (taskId: string) => Object.values(tasksRef.current).flat().find((task) => task.id === taskId);
  const updateList = (listId: string, change: Partial<BoardList>) =>
    setLists((current) => current.map((list) => (list.id === listId ? { ...list, ...change } : list)).sort(byPosition));
  const replaceTask = (task: BoardTask) =>
    setTasksByList((current) => ({
      ...current,
      [task.listId]: (current[task.listId] ?? []).map((item) => (item.id === task.id ? task : item)),
    }));

  async function reload() {
    try {
      const [freshBoard, freshLists] = await Promise.all([
        repositories.boards.fetchBoard(boardRef.current.id),
        repositories.lists.fetchLists(boardRef.current.id),
      ]);
      const freshTasks = await repositories.tasks.fetchTasks(freshLists.map((list) => list.id));
      if (freshBoard) setBoard(freshBoard);
      setLists(freshLists);
      setTasksByList(groupTasks(freshLists, freshTasks));
    } catch {
      // The error of the change is already shown.
    }
  }

  // ─── Lists ────────────────────────────────────────────

  /** Adds a list at the end of the board. Errors are shown in the modal. */
  async function createList(name: string, style: BoardListStyle) {
    const last = listsRef.current.at(-1);
    const list = await repositories.lists.create({
      boardId: boardRef.current.id,
      name,
      style,
      position: positionAfter(last?.position ?? null),
    });
    setLists((current) => [...current, list]);
    setTasksByList((current) => ({ ...current, [list.id]: [] }));
    undo.register("Crear lista", () => removeList(list.id));
  }

  function renameList(listId: string, name: string) {
    const trimmed = name.trim();
    const current = findList(listId);
    if (!current || !trimmed || Array.from(trimmed).length > LIST_NAME_MAX_LENGTH || trimmed === current.name) return;
    updateList(listId, { name: trimmed });
    undo.register("Renombrar lista", () => renameList(listId, current.name));
    persist(() => repositories.lists.rename(listId, trimmed));
  }

  function setListStyle(listId: string, style: BoardListStyle) {
    const current = findList(listId);
    if (!current || current.style === style) return;
    updateList(listId, { style });
    undo.register("Cambiar estilo", () => setListStyle(listId, current.style));
    persist(() => repositories.lists.setStyle(listId, style));
  }

  /** Moves a list to `toIndex` (drag and drop). */
  function moveList(listId: string, toIndex: number) {
    const order = [...listsRef.current];
    const fromIndex = order.findIndex((list) => list.id === listId);
    if (fromIndex === -1 || fromIndex === toIndex) return;
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    setListPosition(listId, positionAt(order, toIndex));
  }

  /** Places a list at a position. Used by drag and drop, and to undo a move. */
  function setListPosition(listId: string, position: number) {
    const current = findList(listId);
    if (!current || current.position === position) return;
    updateList(listId, { position });
    undo.register("Mover lista", () => setListPosition(listId, current.position));
    persist(() => repositories.lists.setPosition(listId, position));
  }

  function removeListLocally(listId: string) {
    setLists((current) => current.filter((list) => list.id !== listId));
    setTasksByList((current) => {
      const next = { ...current };
      delete next[listId];
      return next;
    });
  }

  /** Deletes a list after its confirmation dialog. Errors are shown in the dialog. */
  async function deleteList(listId: string) {
    const list = findList(listId);
    if (!list) return;
    const tasks = tasksRef.current[listId] ?? [];
    await repositories.lists.delete(listId);
    removeListLocally(listId);
    undo.register("Eliminar lista", () => restoreList(list, tasks));
  }

  /** Deletes a list without asking: undo of "Crear lista" and redo of "Eliminar lista". */
  function removeList(listId: string) {
    const list = findList(listId);
    if (!list) return;
    const tasks = tasksRef.current[listId] ?? [];
    removeListLocally(listId);
    undo.register("Eliminar lista", () => restoreList(list, tasks));
    persist(() => repositories.lists.delete(listId));
  }

  /** Brings back a deleted list with its tasks, with the same identifiers and data. */
  function restoreList(list: BoardList, tasks: BoardTask[]) {
    if (findList(list.id)) return;
    setLists((current) => [...current, list].sort(byPosition));
    setTasksByList((current) => ({ ...current, [list.id]: tasks }));
    undo.register("Eliminar lista", () => removeList(list.id));
    persist(async () => {
      await repositories.lists.restore([list]);
      await repositories.tasks.restore(tasks);
    });
  }

  // ─── Tasks ────────────────────────────────────────────

  /** Adds a task at the end of a list. Errors are shown in the field. */
  async function addTask(listId: string, name: string) {
    const last = tasksRef.current[listId]?.at(-1);
    const task = await repositories.tasks.create({ listId, name, position: positionAfter(last?.position ?? null) });
    setTasksByList((current) => ({ ...current, [listId]: [...(current[listId] ?? []), task] }));
    undo.register("Añadir tarea", () => removeTask(task.id));
  }

  /** Saves the task modal. Errors are shown in the modal. */
  async function updateTask(taskId: string, draft: TaskDraft) {
    const current = findTask(taskId);
    if (!current) return;
    replaceTask(await repositories.tasks.update(taskId, draft));
    undo.register("Editar tarea", () => applyTaskDraft(taskId, draftFromTask(current), "Editar tarea"));
  }

  function setTaskColor(taskId: string, color: PaletteColor | null) {
    const task = findTask(taskId);
    if (!task || task.color === color) return;
    applyTaskDraft(taskId, { ...draftFromTask(task), color }, "Cambiar color");
  }

  /** Applies a task's name, description and color: to change its color and to undo edits. */
  function applyTaskDraft(taskId: string, draft: TaskDraft, actionName: string) {
    const task = findTask(taskId);
    if (!task) return;
    const description = draft.description.trim();
    replaceTask({ ...task, name: draft.name.trim(), description: description || null, color: draft.color });
    undo.register(actionName, () => applyTaskDraft(taskId, draftFromTask(task), actionName));
    persist(() => repositories.tasks.update(taskId, draft));
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
    undo.register("Mover tarea", () => placeTask(taskId, origin.listId, origin.position));
    persist(() => repositories.tasks.move(taskId, task.listId, position));
  }

  /** Puts a task in a list at a position: to undo and redo a move. */
  function placeTask(taskId: string, listId: string, position: number) {
    const task = findTask(taskId);
    if (!task || !findList(listId)) return;
    if (task.listId === listId && task.position === position) return;
    setTasksByList((current) => {
      const next = { ...current };
      next[task.listId] = (next[task.listId] ?? []).filter((item) => item.id !== taskId);
      next[listId] = [...(next[listId] ?? []), { ...task, listId, position }].sort(byPosition);
      return next;
    });
    undo.register("Mover tarea", () => placeTask(taskId, task.listId, task.position));
    persist(() => repositories.tasks.move(taskId, listId, position));
  }

  function removeTaskLocally(task: BoardTask) {
    setTasksByList((current) => ({
      ...current,
      [task.listId]: (current[task.listId] ?? []).filter((item) => item.id !== task.id),
    }));
  }

  /** Deletes a task after its confirmation dialog. Errors are shown in the dialog. */
  async function deleteTask(taskId: string) {
    const task = findTask(taskId);
    if (!task) return;
    await repositories.tasks.delete(taskId);
    removeTaskLocally(task);
    undo.register("Eliminar tarea", () => restoreTask(task));
  }

  /** Deletes a task without asking: undo of "Añadir tarea" and redo of "Eliminar tarea". */
  function removeTask(taskId: string) {
    const task = findTask(taskId);
    if (!task) return;
    removeTaskLocally(task);
    undo.register("Eliminar tarea", () => restoreTask(task));
    persist(() => repositories.tasks.delete(taskId));
  }

  /** Brings back a deleted task with the same identifier and data. */
  function restoreTask(task: BoardTask) {
    if (findTask(task.id) || !findList(task.listId)) return;
    setTasksByList((current) => ({
      ...current,
      [task.listId]: [...(current[task.listId] ?? []), task].sort(byPosition),
    }));
    undo.register("Eliminar tarea", () => removeTask(task.id));
    persist(() => repositories.tasks.restore([task]));
  }

  // ─── Board ────────────────────────────────────────────

  /** Saves the board settings modal. Errors are shown in the modal. */
  async function updateBoard(draft: BoardDraft) {
    const previous = draftFromBoard(boardRef.current);
    setBoard(await repositories.boards.update(boardRef.current.id, draft));
    undo.register("Configuración del tablero", () => applyBoardDraft(previous));
  }

  /** Applies board settings without the modal, to undo or redo a change. */
  function applyBoardDraft(draft: BoardDraft) {
    const previous = draftFromBoard(boardRef.current);
    const description = draft.description.trim();
    setBoard((current) => ({
      ...current,
      name: draft.name.trim(),
      description: description || null,
      background: draft.background,
      isFavorite: draft.isFavorite,
    }));
    undo.register("Configuración del tablero", () => applyBoardDraft(previous));
    persist(() => repositories.boards.update(boardRef.current.id, draft));
  }

  function toggleFavorite() {
    const isFavorite = !boardRef.current.isFavorite;
    setBoard((current) => ({ ...current, isFavorite }));
    undo.register(isFavorite ? "Añadir a favoritos" : "Quitar de favoritos", toggleFavorite);
    persist(() => repositories.boards.setFavorite(boardRef.current.id, isFavorite));
  }

  async function deleteBoard() {
    await repositories.boards.delete(boardRef.current.id);
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
