"use client";

import { useState } from "react";
import { AppHeader } from "@/components/workspace/AppHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDeletionDialog } from "@/components/ui/ConfirmDeletionDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GlassButton, GlassSearchField } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { boardDeletionMessage, sortAndFilterBoards, type Board, type BoardSummary } from "@/lib/data/boards";
import { useUndoShortcuts } from "@/lib/useUndoShortcuts";
import { BoardCard } from "./BoardCard";
import { BoardEditorModal, type BoardEditorMode } from "./BoardEditorModal";
import { useHome } from "./useHome";
import styles from "./home.module.css";

type HomeScreenProps = {
  initialBoards: Board[];
  initialSummaries: Record<string, BoardSummary>;
};

/** Home: "Mi espacio de trabajo" with the user's boards, favorites first. */
export function HomeScreen({ initialBoards, initialSummaries }: HomeScreenProps) {
  const { undoManager, undoMessage } = useUndoShortcuts();
  const home = useHome({ boards: initialBoards, summaries: initialSummaries }, undoManager);
  const { boards, summaryOf } = home;
  const [searchText, setSearchText] = useState("");
  const [editor, setEditor] = useState<BoardEditorMode | null>(null);
  const [deletion, setDeletion] = useState<Board | null>(null);

  const visibleBoards = sortAndFilterBoards(boards, searchText);

  const showCreateBoard = () => setEditor({ kind: "create" });
  const showSettings = (board: Board) => setEditor({ kind: "settings", board, summary: summaryOf(board) });

  return (
    <>
      <AppHeader>
        <GlassSearchField
          label="Buscar tableros"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className={styles.search}
        />
        <GlassButton variant="prominent" onClick={showCreateBoard}>
          <Icon name="plus" strokeWidth={1.8} />
          <span className={styles.createLabel}>Crear</span>
        </GlassButton>
      </AppHeader>

      <main className={styles.page}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Mi espacio de trabajo</h1>
          {boards.length > 0 && (
            <p className={styles.titleMeta}>
              {boards.length === 1 ? "1 tablero" : `${boards.length} tableros`} · favoritos primero
            </p>
          )}
        </div>

        {boards.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon name="boards" size={28} strokeWidth={1.2} />
            <h2 className={styles.emptyTitle}>Crea tu primer tablero</h2>
            <p className={styles.emptyText}>Organiza tu trabajo en listas y tareas.</p>
            <Button variant="primary" onClick={showCreateBoard}>
              Crear tablero
            </Button>
          </div>
        ) : visibleBoards.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <Icon name="search" size={28} strokeWidth={1.2} />
            <h2 className={styles.emptyTitle}>Sin resultados para «{searchText.trim()}»</h2>
            <p className={styles.emptyText}>Prueba con otro nombre.</p>
          </div>
        ) : (
          <ul className={styles.grid} aria-label="Tableros">
            {visibleBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                summary={summaryOf(board)}
                onToggleFavorite={() => home.toggleFavorite(board.id)}
                onShowSettings={() => showSettings(board)}
                onDelete={() => setDeletion(board)}
              />
            ))}
            <li className={styles.createItem}>
              <button type="button" className={styles.createCard} onClick={showCreateBoard}>
                <Icon name="plus" size={18} /> Crear tablero
              </button>
            </li>
          </ul>
        )}
      </main>

      <p className="visually-hidden" role="status" aria-live="polite">
        {undoMessage}
      </p>

      {home.actionError && (
        <div className={styles.banner}>
          <ErrorBanner message={home.actionError} onDismiss={home.dismissActionError} />
        </div>
      )}

      {editor?.kind === "create" && (
        <BoardEditorModal mode={editor} onSave={home.createBoard} onClose={() => setEditor(null)} />
      )}
      {editor?.kind === "settings" && (
        <BoardEditorModal
          mode={editor}
          onSave={(draft) => home.updateBoard(editor.board.id, draft)}
          onDelete={() => setDeletion(editor.board)}
          onClose={() => setEditor(null)}
        />
      )}
      {deletion && (
        <ConfirmDeletionDialog
          title={`¿Eliminar «${deletion.name}»?`}
          message={boardDeletionMessage(summaryOf(deletion))}
          actionLabel="Eliminar tablero"
          onConfirm={async () => {
            await home.deleteBoard(deletion.id);
            setEditor(null);
          }}
          onClose={() => setDeletion(null)}
        />
      )}
    </>
  );
}
