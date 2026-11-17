"use client";

import { useId, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { AppBackground } from "@/components/ui/AppBackground";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { BoardBackgroundPicker, PaletteColorPicker } from "@/components/ui/ColorPickers";
import { ConfirmDeletionDialog } from "@/components/ui/ConfirmDeletionDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FormField } from "@/components/ui/FormField";
import { FormTextArea } from "@/components/ui/FormTextArea";
import { GlassButton, GlassGroup, GlassGroupButton, GlassSeparator } from "@/components/ui/Glass";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { Modal, ModalFooter, ModalHeader } from "@/components/ui/Modal";
import type { BoardBackground, PaletteColor } from "@/lib/palette";
import styles from "./page.module.css";

/** Shows every design system component, to compare them with the design artifacts. */
export function ComponentGallery() {
  const [color, setColor] = useState<PaletteColor | null>("amber");
  const [background, setBackground] = useState<BoardBackground>("teal");
  const [nickname, setNickname] = useState("lortega");
  const [openPanel, setOpenPanel] = useState<"notes" | "planner" | null>("notes");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const modalTitleId = useId();

  return (
    <main className={styles.page}>
      <AppBackground />
      <Logo height={50} />

      <section className={styles.section}>
        <h2 className={styles.heading}>Botones</h2>
        <div className={styles.row}>
          <Button variant="primary">Guardar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="plain">
            <Icon name="trash" /> Eliminar tarea…
          </Button>
          <Button variant="danger">Eliminar tablero</Button>
          <Button variant="primary" isLoading>
            Guardar
          </Button>
          <Button variant="primary" disabled>
            Guardar
          </Button>
          <IconButton icon="ellipsis" label="Opciones" />
          <IconButton icon="xmark" label="Cerrar" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Vidrio</h2>
        <div className={styles.row}>
          <GlassButton variant="prominent">
            <Icon name="plus" strokeWidth={1.8} /> Crear
          </GlassButton>
          <GlassButton shape="circle" aria-label="Cuenta de Lucía Ortega">
            LO
          </GlassButton>
          <GlassButton shape="circle" aria-label="Configuración del tablero">
            <Icon name="ellipsis" />
          </GlassButton>
          <GlassGroup label="Herramientas del tablero">
            <GlassGroupButton isActive={openPanel === "notes"} onClick={() => setOpenPanel(openPanel === "notes" ? null : "notes")}>
              <Icon name="notes" /> Notas
            </GlassGroupButton>
            <GlassGroupButton isActive={openPanel === "planner"} onClick={() => setOpenPanel(openPanel === "planner" ? null : "planner")}>
              <Icon name="calendar" /> Planificador
            </GlassGroupButton>
            <GlassSeparator />
            <GlassGroupButton>
              <Icon name="plus" strokeWidth={1.8} /> Añade una lista
            </GlassGroupButton>
          </GlassGroup>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Formularios</h2>
        <div className={styles.card}>
          <FormField label="Nombre y apellidos" defaultValue="Lucía Ortega" />
          <FormField
            label="Nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            message={{ kind: "error", text: "Ese nickname ya está en uso. Prueba con otro." }}
          />
          <FormField
            label="Contraseña"
            type="password"
            placeholder="Contraseña"
            message={{ kind: "help", text: "Mínimo 8 caracteres." }}
            accessory={<a href="#">¿Olvidaste la contraseña?</a>}
          />
          <FormTextArea label="Descripción" note="(opcional)" placeholder="¿De qué trata este tablero?" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Color y fondo</h2>
        <div className={styles.card}>
          <PaletteColorPicker value={color} onChange={setColor} />
          <BoardBackgroundPicker value={background} onChange={setBackground} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Avatar y avisos</h2>
        <div className={styles.row}>
          <Avatar fullName="Daniel Ruiz" size="mini" />
          <Avatar fullName="Daniel Ruiz" />
          <Avatar fullName="Lucía Ortega" size="large" />
          <Avatar fullName="Marta" size="large" />
          <ErrorBanner message="No se han podido guardar los cambios." onDismiss={() => {}} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Modales</h2>
        <div className={styles.row}>
          <Button onClick={() => setIsModalOpen(true)}>Abrir modal</Button>
          <Button variant="plain" onClick={() => setIsConfirmOpen(true)}>
            <Icon name="trash" /> Abrir confirmación
          </Button>
        </div>
      </section>

      {isModalOpen && (
        <Modal labelledBy={modalTitleId} onClose={() => setIsModalOpen(false)}>
          <ModalHeader id={modalTitleId} title="Configuración del tablero" onClose={() => setIsModalOpen(false)} />
          <FormField label="Nombre" defaultValue="Lanzamiento v2" />
          <BoardBackgroundPicker value={background} onChange={setBackground} />
          <ModalFooter>
            <Button variant="plain" onClick={() => setIsConfirmOpen(true)}>
              <Icon name="trash" /> Eliminar tablero…
            </Button>
            <span className={styles.spacer} />
            <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Guardar
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {isConfirmOpen && (
        <ConfirmDeletionDialog
          title="¿Eliminar «Lanzamiento v2»?"
          message="Se borrarán el tablero, sus 4 listas y sus 23 tareas. Esta acción no se puede deshacer."
          actionLabel="Eliminar tablero"
          onConfirm={async () => {}}
          onClose={() => setIsConfirmOpen(false)}
        />
      )}
    </main>
  );
}
