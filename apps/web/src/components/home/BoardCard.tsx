"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { useContextMenu } from "@/components/ui/ContextMenu";
import { boardSummaryText, type Board, type BoardSummary } from "@/lib/data/boards";
import { cx } from "@/lib/cx";
import { BoardCover } from "./BoardCover";
import styles from "./home.module.css";

type BoardCardProps = {
  board: Board;
  summary: BoardSummary;
  onToggleFavorite: () => void;
  onShowSettings: () => void;
  onDelete: () => void;
};

/**
 * A board in "Mi espacio de trabajo": color strip, name and summary. The star (top left)
 * and "⋯" (top right) appear on hover or keyboard focus; a favorite always shows its
 * filled star. Right click opens the context menu.
 */
export function BoardCard({ board, summary, onToggleFavorite, onShowSettings, onDelete }: BoardCardProps) {
  const router = useRouter();
  const href = `/app/tableros/${board.id}`;
  const favoriteLabel = board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos";

  const { onContextMenu, menu } = useContextMenu([
    { label: "Abrir", icon: "arrowUpRight", onSelect: () => router.push(href) },
    { label: favoriteLabel, icon: board.isFavorite ? "star" : "starFill", onSelect: onToggleFavorite },
    { label: "Configuración del tablero…", icon: "sliders", onSelect: onShowSettings },
    { label: "Eliminar tablero…", icon: "trash", onSelect: onDelete, isDestructive: true },
  ]);

  return (
    <li className={cx(styles.card, board.isFavorite && styles.cardFavorite)} onContextMenu={onContextMenu}>
      <Link href={href} className={styles.cardLink}>
        <BoardCover background={board.background} height={64} />
        <span className={styles.cardBody}>
          <span className={styles.cardName}>{board.name}</span>
          <span className={styles.cardMeta}>
            {boardSummaryText(summary)}
            {board.isFavorite && <span className="visually-hidden">, favorito</span>}
          </span>
        </span>
      </Link>
      <IconButton
        icon={board.isFavorite ? "starFill" : "star"}
        label={favoriteLabel}
        aria-pressed={board.isFavorite}
        className={cx(styles.cardAction, styles.cardFavoriteButton)}
        onClick={onToggleFavorite}
      />
      <IconButton
        icon="ellipsis"
        label="Configuración del tablero"
        className={cx(styles.cardAction, styles.cardMoreButton)}
        onClick={onShowSettings}
      />
      {menu}
    </li>
  );
}
