"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import { useContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { IconButton } from "@/components/ui/IconButton";
import { cx } from "@/lib/cx";
import { LIST_NAME_MAX_LENGTH, LIST_STYLES, LIST_STYLE_NAMES, type BoardList, type BoardListStyle } from "@/lib/data/lists";
import type { BoardTask } from "@/lib/data/tasks";
import type { PaletteColor } from "@/lib/palette";
import { AddTaskField } from "./AddTaskField";
import { TaskCard, TaskCardFace } from "./TaskCard";
import styles from "./board.module.css";

type ListColumnProps = {
  list: BoardList;
  tasks: BoardTask[];
  /** A dragged task is over this list: it would be dropped here. */
  isDropTarget: boolean;
  onRename: (name: string) => void;
  onSetStyle: (style: BoardListStyle) => void;
  onDelete: () => void;
  onAddTask: (name: string) => Promise<void>;
  onOpenTask: (task: BoardTask) => void;
  onSetTaskColor: (task: BoardTask, color: PaletteColor | null) => void;
  onDeleteTask: (task: BoardTask) => void;
};

/** Class with the colors of a list style (white or black), for the list and what is inside it. */
export function listTheme(style: BoardListStyle | undefined) {
  return style === "dark" ? styles.themeDark : styles.themeLight;
}

/** Elements where a pointer press must not start dragging the list (typing, selecting text). */
function isTextEntry(target: EventTarget) {
  return target instanceof HTMLElement && target.closest("input, textarea, [contenteditable=true]") !== null;
}

/**
 * A list column (264 px): white or black, with its header, tasks and "Añade una tarea".
 * The list is dragged from anywhere outside its tasks, or from its name with Space and
 * the arrow keys. A task dropped on the list (also an empty one) goes to the end.
 */
export function ListColumn({
  list,
  tasks,
  isDropTarget,
  onRename,
  onSetStyle,
  onDelete,
  onAddTask,
  onOpenTask,
  onSetTaskColor,
  onDeleteTask,
}: ListColumnProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: list.id, data: { type: "list" }, attributes: { roleDescription: "lista" } });
  const [isRenaming, setIsRenaming] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const menuItems: ContextMenuItem[] = [
    { label: "Renombrar", icon: "pencil", onSelect: () => setIsRenaming(true) },
    ...LIST_STYLES.map((style, index) => ({
      label: `Estilo ${LIST_STYLE_NAMES[style].toLowerCase()}`,
      isChecked: list.style === style,
      onSelect: () => onSetStyle(style),
      hasSeparatorBefore: index === 0,
    })),
    { label: "Eliminar lista…", icon: "trash", onSelect: onDelete, isDestructive: true },
  ];
  const { onContextMenu, openBelow, menu } = useContextMenu(menuItems);

  // Pointer listeners on the whole list; keyboard listeners only on its name.
  const { onKeyDown: onActivatorKeyDown, ...pointerListeners } = listeners ?? {};
  const listPointerHandlers = Object.fromEntries(
    Object.entries(pointerListeners).map(([event, handler]) => [
      event,
      (syntheticEvent: SyntheticEvent) => {
        if (!isTextEntry(syntheticEvent.target)) (handler as (event: SyntheticEvent) => void)(syntheticEvent);
      },
    ]),
  );

  return (
    <section
      ref={setNodeRef}
      className={cx(styles.list, listTheme(list.style), isDragging && styles.placeholder)}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={list.name}
      data-drop-target={isDropTarget || undefined}
      onContextMenu={onContextMenu}
      {...listPointerHandlers}
    >
      <header className={styles.listHeader}>
        {isRenaming ? (
          <ListNameField
            name={list.name}
            onCommit={(name) => {
              setIsRenaming(false);
              onRename(name);
            }}
            onCancel={() => setIsRenaming(false)}
          />
        ) : (
          <div
            ref={setActivatorNodeRef}
            className={styles.listHandle}
            {...attributes}
            aria-label={`Lista ${list.name}`}
            onKeyDown={onActivatorKeyDown as ((event: KeyboardEvent) => void) | undefined}
            onDoubleClick={() => setIsRenaming(true)}
          >
            <h2 className={styles.listName}>{list.name}</h2>
          </div>
        )}
        <span className={styles.listCount} aria-label={tasks.length === 1 ? "1 tarea" : `${tasks.length} tareas`}>
          {tasks.length}
        </span>
        <IconButton
          ref={moreButtonRef}
          icon="ellipsis"
          label="Opciones de la lista"
          className={styles.listMore}
          onClick={() => moreButtonRef.current && openBelow(moreButtonRef.current)}
        />
      </header>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className={styles.taskStack}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpen={() => onOpenTask(task)}
              onSetColor={(color) => onSetTaskColor(task, color)}
              onDelete={() => onDeleteTask(task)}
            />
          ))}
        </div>
      </SortableContext>

      <AddTaskField listName={list.name} onAdd={onAddTask} />
      {menu}
    </section>
  );
}

/** Rename in place: Enter or leaving the field saves, Esc cancels. */
function ListNameField({ name, onCommit, onCancel }: { name: string; onCommit: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(name);
  const isDone = useRef(false);

  function finish(save: boolean) {
    if (isDone.current) return;
    isDone.current = true;
    if (save) onCommit(value);
    else onCancel();
  }

  return (
    <input
      className={styles.listNameField}
      aria-label="Nombre de la lista"
      value={value}
      maxLength={LIST_NAME_MAX_LENGTH}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter") finish(true);
        if (event.key === "Escape") {
          event.stopPropagation();
          finish(false);
        }
      }}
      autoFocus
      onFocus={(event) => event.target.select()}
    />
  );
}

/** The list as it looks while dragging it: whole, with its tasks (up to 12). */
export function ListDragPreview({ list, tasks }: { list: BoardList; tasks: BoardTask[] }) {
  const shown = tasks.slice(0, 12);
  return (
    <div className={cx(styles.list, listTheme(list.style), styles.lifted)}>
      <div className={styles.listHeader}>
        <span className={cx(styles.listName, styles.listNameFill)}>{list.name}</span>
        <span className={styles.listCount}>{tasks.length}</span>
      </div>
      <div className={styles.taskStack}>
        {shown.map((task) => (
          <TaskCardFace key={task.id} task={task} />
        ))}
        {tasks.length > shown.length && <span className={styles.moreTasks}>y {tasks.length - shown.length} más</span>}
      </div>
    </div>
  );
}
