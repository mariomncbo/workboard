"use client";

import { useState } from "react";
import { AppHeader } from "@/components/workspace/AppHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDeletionDialog } from "@/components/ui/ConfirmDeletionDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GlassButton, GlassSearchField } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import {
  EMPTY_SUMMARY,
  boardDeletionMessage,
  boardRepository,
  sortAndFilterBoards,
  type Board,
  type BoardDraft,
  type BoardSummary,
} from "@/lib/data/boards";
import { DataFailureError, dataFailureMessage } from "@/lib/data/dataFailure";
import { createClient } from "@/lib/supabase/client";
import { BoardCard } from "./BoardCard";
import { BoardEditorModal, type BoardEditorMode } from "./BoardEditorModal";
import styles from "./home.module.css";

type HomeScreenProps = {
  initialBoards: Board[];
  initialSummaries: Record<string, BoardSummary>;
};

/** Home: "Mi espacio de trabajo" with the user's boards, favorites first. */
export function HomeScreen({ initialBoards, initialSummaries }: HomeScreenProps) {
  const [repository] = useState(() => boardRepository(createClient()));
  const [boards, setBoards] = useState(initialBoards);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [searchText, setSearchText] = useState("");
  const [editor, setEditor] = useState<BoardEditorMode | null>(null);
  const [deletion, setDeletion] = useState<Board | null>(null);
  /** A change that could not be saved. */
  const [actionError, setActionError] = useState<string | null>(null);

  const visibleBoards = sortAndFilterBoards(boards, searchText);
  const summaryOf = (board: Board) => summaries[board.id] ?? EMPTY_SUMMARY;
  const replace = (board: Board) => setBoards((current) => current.map((item) => (item.id === board.id ? board : item)));

  async function createBoard(draft: BoardDraft) {
    const board = await repository.create(draft);
    setBoards((current) => [...current, board]);
  }

  async function updateBoard(board: Board, draft: BoardDraft) {
    replace(await repository.update(board.id, draft));
  }

  /** Shown on screen right away; if saving fails, it goes back and the error is shown. */
  async function toggleFavorite(board: Board) {
    const isFavorite = !board.isFavorite;
    replace({ ...board, isFavorite });
    setActionError(null);
    try {
      await repository.setFavorite(board.id, isFavorite);
    } catch (failure) {
      replace(board);
      setActionError(failure instanceof DataFailureError ? failure.message : dataFailureMessage("unexpected"));
    }
  }

  async function deleteBoard(board: Board) {
    await repository.delete(board.id);
    setBoards((current) => current.filter((item) => item.id !== board.id));
    setSummaries((current) => {
      const next = { ...current };
      delete next[board.id];
      return next;
    });
    setEditor(null);
  }

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
                onToggleFavorite={() => toggleFavorite(board)}
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

      {actionError && (
        <div className={styles.banner}>
          <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />
        </div>
      )}

      {editor?.kind === "create" && (
        <BoardEditorModal mode={editor} onSave={createBoard} onClose={() => setEditor(null)} />
      )}
      {editor?.kind === "settings" && (
        <BoardEditorModal
          mode={editor}
          onSave={(draft) => updateBoard(editor.board, draft)}
          onDelete={() => setDeletion(editor.board)}
          onClose={() => setEditor(null)}
        />
      )}
      {deletion && (
        <ConfirmDeletionDialog
          title={`¿Eliminar «${deletion.name}»?`}
          message={boardDeletionMessage(summaryOf(deletion))}
          actionLabel="Eliminar tablero"
          onConfirm={() => deleteBoard(deletion)}
          onClose={() => setDeletion(null)}
        />
      )}
    </>
  );
}
