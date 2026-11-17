"use client";

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useId, useRef, useState } from "react";
import type { BoardController, TasksByList } from "./useBoard";

type ActiveItem = { type: "task" | "list"; id: string };

const typeOf = (data: { current?: Record<string, unknown> | null } | undefined) =>
  data?.current?.type as "task" | "list" | undefined;

/**
 * Drag and drop of lists and tasks (dnd-kit). A list is dropped onto another list's place;
 * a task moves within its list or to another one while dragging, and its new position is
 * saved when dropped. Works with the mouse, touch (press and hold) and the keyboard
 * (Space to pick up, arrows to move, Space to drop, Esc to cancel), with announcements
 * for screen readers.
 */
export function useBoardDragAndDrop(board: BoardController) {
  // A stable id, so the accessibility ids of dnd-kit match between server and browser.
  const contextId = useId();
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  /** The list a dragged task is in right now: highlighted as the drop target. */
  const [dropListId, setDropListId] = useState<string | null>(null);
  const snapshot = useRef<TasksByList | null>(null);
  /** With the keyboard there is no pointer: only the dragged rectangle moves. */
  const isKeyboardDrag = useRef(false);
  const origin = useRef<{ listId: string; position: number } | null>(null);

  const sensors = useSensors(
    // A small movement before dragging, so a click still opens a task.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // On touch screens, press and hold to drag; a swipe still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    // Space picks up and drops; Enter is left to open the task.
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const listName = (listId: string) => board.lists.find((list) => list.id === listId)?.name ?? "";
  const nameOf = (id: UniqueIdentifier) =>
    board.findTask(String(id))?.name ?? board.lists.find((list) => list.id === id)?.name ?? "";

  /**
   * Where a dragged task will end up if dropped now, in the list it is in: the place of the
   * task it is over (like `onDragEnd`), or where it already is.
   */
  function projectedIndex(taskId: string, overId: string) {
    const task = board.findTask(taskId);
    if (!task) return 0;
    const listTasks = board.tasksRef.current[task.listId] ?? [];
    const overTask = board.findTask(overId);
    const current = listTasks.findIndex((item) => item.id === taskId);
    if (!overTask || overTask.listId !== task.listId || overTask.id === taskId) return current;
    return listTasks.findIndex((item) => item.id === overTask.id);
  }

  /** Lists only collide with lists; tasks prefer the task under the pointer. */
  const collisionDetection: CollisionDetection = (args) => {
    const type = typeOf(args.active.data);
    const containers = args.droppableContainers;
    if (type === "list") {
      return closestCenter({ ...args, droppableContainers: containers.filter((c) => typeOf(c.data) === "list") });
    }
    if (isKeyboardDrag.current) return closestCorners(args);
    const hits = pointerWithin(args);
    // The dragged task itself counts: over its own place, dropping leaves it where it was.
    const taskHit = hits.find((hit) => typeOf(containers.find((c) => c.id === hit.id)?.data) === "task");
    if (taskHit) return [taskHit];
    const listHit = hits.find((hit) => typeOf(containers.find((c) => c.id === hit.id)?.data) === "list");
    if (listHit) {
      // Over a list but between tasks: the closest of its tasks, or the list itself if empty.
      const listTasks = (board.tasksRef.current[String(listHit.id)] ?? []).map((task) => task.id);
      const taskContainers = containers.filter((c) => listTasks.includes(String(c.id)));
      return taskContainers.length ? closestCenter({ ...args, droppableContainers: taskContainers }) : [listHit];
    }
    // The pointer outside every list.
    return closestCorners(args);
  };

  function onDragStart({ active, activatorEvent }: DragStartEvent) {
    isKeyboardDrag.current = activatorEvent instanceof KeyboardEvent;
    const type = typeOf(active.data) ?? "task";
    setActiveItem({ type, id: String(active.id) });
    if (type === "task") {
      const task = board.findTask(String(active.id));
      snapshot.current = board.tasksRef.current;
      origin.current = task ? { listId: task.listId, position: task.position } : null;
      setDropListId(task?.listId ?? null);
    }
  }

  /** Moves a dragged task to another list as soon as it is over it. */
  function onDragOver({ active, over }: DragOverEvent) {
    if (typeOf(active.data) !== "task" || !over) return;
    const task = board.findTask(String(active.id));
    if (!task) return;
    const overType = typeOf(over.data);
    const overTask = overType === "task" ? board.findTask(String(over.id)) : undefined;
    const toListId = overTask?.listId ?? (overType === "list" ? String(over.id) : null);
    if (!toListId) return;
    setDropListId(toListId);
    if (toListId === task.listId) return;

    const target = board.tasksRef.current[toListId] ?? [];
    let index = target.length;
    if (overTask) {
      const overIndex = target.findIndex((item) => item.id === overTask.id);
      const draggedTop = active.rect.current.translated?.top ?? 0;
      const isBelow = draggedTop > over.rect.top + over.rect.height / 2;
      index = overIndex + (isBelow ? 1 : 0);
    }
    board.previewTaskMove(task.id, toListId, index);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const item = activeItem;
    setActiveItem(null);
    setDropListId(null);
    if (!item) return;

    if (item.type === "list") {
      if (over && over.id !== active.id) {
        const toIndex = board.lists.findIndex((list) => list.id === over.id);
        if (toIndex !== -1) board.moveList(item.id, toIndex);
      }
      return;
    }

    if (!over || !origin.current) {
      onDragCancel();
      return;
    }
    // Reorder within the list the task ended up in.
    const task = board.findTask(item.id);
    const overTask = typeOf(over.data) === "task" ? board.findTask(String(over.id)) : undefined;
    if (task && overTask && overTask.listId === task.listId && overTask.id !== task.id) {
      const listTasks = board.tasksRef.current[task.listId] ?? [];
      board.previewTaskMove(task.id, task.listId, listTasks.findIndex((t) => t.id === overTask.id));
    }
    board.commitTaskMove(item.id, origin.current);
    origin.current = null;
    snapshot.current = null;
  }

  function onDragCancel() {
    if (snapshot.current) board.restoreTasks(snapshot.current);
    snapshot.current = null;
    origin.current = null;
    setActiveItem(null);
    setDropListId(null);
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      typeOf(active.data) === "list"
        ? `Has cogido la lista «${nameOf(active.id)}».`
        : `Has cogido la tarea «${nameOf(active.id)}».`,
    onDragOver: ({ active, over }) => {
      if (!over) return `«${nameOf(active.id)}» no está sobre ninguna lista.`;
      if (typeOf(active.data) === "list") return `«${nameOf(active.id)}» está en el lugar de «${nameOf(over.id)}».`;
      const task = board.findTask(String(active.id));
      if (!task) return undefined;
      const listTasks = board.tasksRef.current[task.listId] ?? [];
      return `«${task.name}» está en la posición ${projectedIndex(task.id, String(over.id)) + 1} de ${listTasks.length} de la lista «${listName(task.listId)}».`;
    },
    onDragEnd: ({ active, over }) => {
      if (!over) return `Has soltado «${nameOf(active.id)}» fuera de las listas. Vuelve a su sitio.`;
      if (typeOf(active.data) === "list") return `Has movido la lista «${nameOf(active.id)}».`;
      const task = board.findTask(String(active.id));
      return task ? `Has soltado «${task.name}» en la lista «${listName(task.listId)}».` : undefined;
    },
    onDragCancel: ({ active }) => `Movimiento cancelado. «${nameOf(active.id)}» vuelve a su sitio.`,
  };

  return {
    activeItem,
    dropListId,
    contextProps: {
      id: contextId,
      sensors,
      collisionDetection,
      onDragStart,
      onDragOver,
      onDragEnd,
      onDragCancel,
      accessibility: {
        announcements,
        screenReaderInstructions: {
          draggable:
            "Para moverla, pulsa Espacio. Muévela con las flechas y vuelve a pulsar Espacio para soltarla, o Escape para cancelar.",
        },
      },
    },
  };
}
