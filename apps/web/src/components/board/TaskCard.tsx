"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useContextMenu } from "@/components/ui/ContextMenu";
import { cx } from "@/lib/cx";
import type { BoardTask } from "@/lib/data/tasks";
import { PALETTE_COLORS, PALETTE_COLOR_NAMES, paletteVar, type PaletteColor } from "@/lib/palette";
import styles from "./board.module.css";

const COLOR_OPTIONS = [
  { value: null, name: "Sin color", color: null },
  ...PALETTE_COLORS.map((color) => ({ value: color, name: PALETTE_COLOR_NAMES[color], color: paletteVar(color) })),
];

/** How a task looks: without color it takes the list's field color; with color, white text. */
export function TaskCardFace({ task, className }: { task: BoardTask; className?: string }) {
  return (
    <span
      className={cx(styles.task, task.color && styles.taskColored, className)}
      style={task.color ? { background: paletteVar(task.color) } : undefined}
    >
      {task.name}
    </span>
  );
}

type TaskCardProps = {
  task: BoardTask;
  onOpen: () => void;
  onSetColor: (color: PaletteColor | null) => void;
  onDelete: () => void;
};

/**
 * A task in a list. Click (or Enter) opens it; it can be dragged with the pointer or with
 * Space and the arrow keys. Right click opens its context menu.
 */
export function TaskCard({ task, onOpen, onSetColor, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task" },
    attributes: { roleDescription: "tarea" },
  });

  const { onContextMenu, menu } = useContextMenu([
    { label: "Abrir", icon: "arrowUpRight", onSelect: onOpen },
    {
      kind: "swatches",
      label: "Color",
      options: COLOR_OPTIONS,
      selected: task.color,
      onSelect: (value) => onSetColor(value as PaletteColor | null),
      hasSeparatorBefore: true,
    },
    { label: "Eliminar tarea…", icon: "trash", onSelect: onDelete, isDestructive: true },
  ]);

  return (
    <>
      <button
        ref={setNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        className={cx(styles.taskButton, isDragging && styles.placeholder)}
        style={{ transform: CSS.Translate.toString(transform), transition }}
        onClick={onOpen}
        onContextMenu={onContextMenu}
        aria-label={task.color ? `${task.name}, ${PALETTE_COLOR_NAMES[task.color]}` : task.name}
      >
        <TaskCardFace task={task} />
      </button>
      {menu}
    </>
  );
}
