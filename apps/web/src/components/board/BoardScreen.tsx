"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BoardEditorModal } from "@/components/home/BoardEditorModal";
import { AppHeader } from "@/components/workspace/AppHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDeletionDialog } from "@/components/ui/ConfirmDeletionDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GlassButton } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { cx } from "@/lib/cx";
import { boardDeletionMessage, type Board } from "@/lib/data/boards";
import type { BoardList } from "@/lib/data/lists";
import type { BoardTask } from "@/lib/data/tasks";
import { paletteVar } from "@/lib/palette";
import { useUndoShortcuts } from "@/lib/useUndoShortcuts";
import { FloatingBar, SidePanel, type BoardPanel } from "./BoardPanels";
import { CreateListModal } from "./CreateListModal";
import { ListColumn, ListDragPreview, listTheme } from "./ListColumn";
import { TaskCardFace } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { useBoard } from "./useBoard";
import { useBoardDragAndDrop } from "./useBoardDragAndDrop";
import styles from "./board.module.css";

type Modal = { kind: "settings" } | { kind: "createList" } | { kind: "task"; taskId: string };

type Deletion =
  | { kind: "board" }
  | { kind: "list"; list: BoardList; taskCount: number }
  | { kind: "task"; task: BoardTask };

/** An open board: its lists side by side over its background, the panels and the floating bar. */
export function BoardScreen(initial: { board: Board; lists: BoardList[]; tasks: BoardTask[] }) {
  const router = useRouter();
  const { undoManager, undoMessage } = useUndoShortcuts();
  const board = useBoard(initial, undoManager);
  const dnd = useBoardDragAndDrop(board);
  const [modal, setModal] = useState<Modal | null>(null);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const [openPanel, setOpenPanel] = useState<BoardPanel | null>(null);

  const isColored = board.board.background !== "dots";
  const openTask = modal?.kind === "task" ? board.findTask(modal.taskId) : undefined;
  const closeModal = () => setModal(null);
  const showCreateList = () => setModal({ kind: "createList" });

  async function confirmDeletion(item: Deletion) {
    if (item.kind === "board") {
      await board.deleteBoard();
      router.push("/app");
      router.refresh();
    } else if (item.kind === "list") {
      await board.deleteList(item.list.id);
    } else {
      await board.deleteTask(item.task.id);
      setModal(null);
    }
  }

  function deletionTexts(item: Deletion) {
    switch (item.kind) {
      case "board":
        return {
          title: `¿Eliminar «${board.board.name}»?`,
          message: boardDeletionMessage(board.summary),
          actionLabel: "Eliminar tablero",
        };
      case "list":
        return {
          title: `¿Eliminar la lista «${item.list.name}»?`,
          message:
            item.taskCount === 0
              ? "Se borrará la lista. Esta acción no se puede deshacer."
              : `Se borrarán la lista y ${item.taskCount === 1 ? "su tarea" : `sus ${item.taskCount} tareas`}. Esta acción no se puede deshacer.`,
          actionLabel: "Eliminar lista",
        };
      case "task":
        return {
          title: `¿Eliminar la tarea «${item.task.name}»?`,
          message: "Esta acción no se puede deshacer.",
          actionLabel: "Eliminar tarea",
        };
    }
  }

  const draggedTask = dnd.activeItem?.type === "task" ? board.findTask(dnd.activeItem.id) : undefined;
  const draggedList = dnd.activeItem?.type === "list" ? board.lists.find((list) => list.id === dnd.activeItem?.id) : undefined;

  return (
    <div
      className={cx(styles.screen, isColored && styles.screenColored)}
      style={isColored ? { background: paletteVar(board.board.background as Exclude<typeof board.board.background, "dots">) } : undefined}
    >
      {openPanel && <SidePanel panel={openPanel} onClose={() => setOpenPanel(null)} />}

      <div className={styles.boardArea}>
        <AppHeader
          className={styles.header}
          end={
            <GlassButton shape="circle" aria-label="Configuración del tablero" title="Configuración del tablero" onClick={() => setModal({ kind: "settings" })}>
              <Icon name="ellipsis" />
            </GlassButton>
          }
        >
          <div className={styles.boardTitle}>
            <h1 className={styles.boardName}>{board.board.name}</h1>
            <IconButton
              icon={board.board.isFavorite ? "starFill" : "star"}
              label={board.board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
              aria-pressed={board.board.isFavorite}
              className={board.board.isFavorite ? styles.favoriteOn : styles.favoriteOff}
              onClick={board.toggleFavorite}
            />
          </div>
        </AppHeader>

        <main className={styles.canvas}>
          {board.lists.length === 0 ? (
            <div className={styles.emptyBoard}>
              <div className={styles.emptyArt} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <h2 className={styles.emptyTitle}>Este tablero aún no tiene listas</h2>
              <p className={styles.emptyText}>Crea la primera lista para empezar a organizar las tareas.</p>
              <Button variant="primary" onClick={showCreateList}>
                <Icon name="plus" size={12} strokeWidth={2} /> Añade una lista
              </Button>
            </div>
          ) : (
            <DndContext {...dnd.contextProps}>
              <SortableContext items={board.lists.map((list) => list.id)} strategy={horizontalListSortingStrategy}>
                <div className={styles.listsRow}>
                  {board.lists.map((list) => {
                    const tasks = board.tasksByList[list.id] ?? [];
                    return (
                      <ListColumn
                        key={list.id}
                        list={list}
                        tasks={tasks}
                        isDropTarget={dnd.dropListId === list.id}
                        onRename={(name) => board.renameList(list.id, name)}
                        onSetStyle={(style) => board.setListStyle(list.id, style)}
                        onDelete={() => setDeletion({ kind: "list", list, taskCount: tasks.length })}
                        onAddTask={(name) => board.addTask(list.id, name)}
                        onOpenTask={(task) => setModal({ kind: "task", taskId: task.id })}
                        onSetTaskColor={(task, color) => board.setTaskColor(task.id, color)}
                        onDeleteTask={(task) => setDeletion({ kind: "task", task })}
                      />
                    );
                  })}
                </div>
              </SortableContext>
              <DragOverlay>
                {draggedTask ? (
                  <div className={listTheme(board.lists.find((list) => list.id === draggedTask.listId)?.style)}>
                    <TaskCardFace task={draggedTask} className={styles.lifted} />
                  </div>
                ) : draggedList ? (
                  <ListDragPreview list={draggedList} tasks={board.tasksByList[draggedList.id] ?? []} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </main>

        <FloatingBar
          openPanel={openPanel}
          onTogglePanel={(panel) => setOpenPanel((current) => (current === panel ? null : panel))}
          onAddList={showCreateList}
        />

        <p className="visually-hidden" role="status" aria-live="polite">
          {undoMessage}
        </p>

        {board.actionError && (
          <div className={styles.banner}>
            <ErrorBanner message={board.actionError} onDismiss={board.dismissActionError} />
          </div>
        )}
      </div>

      {modal?.kind === "settings" && (
        <BoardEditorModal
          mode={{ kind: "settings", board: board.board, summary: board.summary }}
          onSave={board.updateBoard}
          onDelete={() => setDeletion({ kind: "board" })}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "createList" && <CreateListModal onCreate={board.createList} onClose={closeModal} />}
      {openTask && (
        <TaskModal
          task={openTask}
          listName={board.lists.find((list) => list.id === openTask.listId)?.name ?? ""}
          onSave={(draft) => board.updateTask(openTask.id, draft)}
          onDelete={() => setDeletion({ kind: "task", task: openTask })}
          onClose={closeModal}
        />
      )}
      {deletion && (
        <ConfirmDeletionDialog
          {...deletionTexts(deletion)}
          onConfirm={() => confirmDeletion(deletion)}
          onClose={() => setDeletion(null)}
        />
      )}
    </div>
  );
}
