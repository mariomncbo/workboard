"use client";

import { GlassGroup, GlassGroupButton, GlassSeparator } from "@/components/ui/Glass";
import { Icon, type IconName } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import styles from "./board.module.css";

/** Side panels of a board. Only one can be open at a time. */
export type BoardPanel = "notes" | "planner";

const PANELS: Record<BoardPanel, { title: string; icon: IconName; message: string }> = {
  notes: { title: "Notas", icon: "notes", message: "Aquí podrás escribir notas ligadas a este tablero." },
  planner: {
    title: "Planificador",
    icon: "calendar",
    message: "Aquí podrás planificar las tareas de este tablero en el tiempo.",
  },
};

/**
 * Side panel on the left of the board (320 px): title, close button and content. It
 * narrows the board instead of covering it. For now both panels say "Próximamente".
 */
export function SidePanel({ panel, onClose }: { panel: BoardPanel; onClose: () => void }) {
  const { title, icon, message } = PANELS[panel];
  const titleId = `panel-${panel}-title`;
  return (
    <aside className={styles.sidePanel} aria-labelledby={titleId}>
      <div className={styles.sidePanelHeader}>
        <h2 id={titleId} className={styles.sidePanelTitle}>
          {title}
        </h2>
        <IconButton icon="xmark" label={`Cerrar ${title}`} className={styles.modalClose} onClick={onClose} />
      </div>
      <div className={styles.comingSoon}>
        <Icon name={icon} size={28} strokeWidth={1.2} className={styles.comingSoonIcon} />
        <p className={styles.comingSoonTitle}>Próximamente</p>
        <p className={styles.comingSoonText}>{message}</p>
      </div>
    </aside>
  );
}

/**
 * Glass bar centered at the bottom of the board: Notas, Planificador | Añade una lista.
 * The button of the open panel is highlighted; pressing it again closes the panel.
 */
export function FloatingBar({
  openPanel,
  onTogglePanel,
  onAddList,
}: {
  openPanel: BoardPanel | null;
  onTogglePanel: (panel: BoardPanel) => void;
  onAddList: () => void;
}) {
  return (
    <div className={styles.floatingBar}>
      <GlassGroup label="Herramientas del tablero">
        {(Object.keys(PANELS) as BoardPanel[]).map((panel) => (
          <GlassGroupButton key={panel} isActive={openPanel === panel} onClick={() => onTogglePanel(panel)}>
            <Icon name={PANELS[panel].icon} /> {PANELS[panel].title}
          </GlassGroupButton>
        ))}
        <GlassSeparator />
        <GlassGroupButton onClick={onAddList}>
          <Icon name="plus" strokeWidth={1.8} /> Añade una lista
        </GlassGroupButton>
      </GlassGroup>
    </div>
  );
}
