"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";
import styles from "./ContextMenu.module.css";

type ActionItem = {
  kind?: "action";
  label: string;
  icon?: IconName;
  onSelect: () => void;
  /** An option of a group (such as the list style): shows a checkmark when selected. */
  isChecked?: boolean;
  /** The delete action: last, separated and in red, with "…" in its label. */
  isDestructive?: boolean;
  /** Draws a separator above the item. */
  hasSeparatorBefore?: boolean;
};

/** A row of color swatches, such as the color of a task. `null` is "Sin color". */
type SwatchesItem = {
  kind: "swatches";
  label: string;
  options: { value: string | null; name: string; color: string | null }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  hasSeparatorBefore?: boolean;
};

export type ContextMenuItem = ActionItem | SwatchesItem;

type Position = { x: number; y: number };

/**
 * Opens a context menu at the pointer (right click), under the element with the keyboard
 * (Shift+F10 or the menu key), or under a "⋯" button. Returns the handlers and the menu
 * to render.
 */
export function useContextMenu(items: ContextMenuItem[]) {
  const [position, setPosition] = useState<Position | null>(null);

  function onContextMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    // Opened from the keyboard, the event has no pointer position.
    if (event.clientX === 0 && event.clientY === 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      setPosition({ x: rect.left + 12, y: rect.top + 12 });
    } else {
      setPosition({ x: event.clientX, y: event.clientY });
    }
  }

  /** Opens the menu under a button, aligned with its left edge. */
  function openBelow(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.bottom + 4 });
  }

  const menu = position ? <ContextMenu position={position} items={items} onClose={() => setPosition(null)} /> : null;
  return { onContextMenu, openBelow, isOpen: position !== null, menu };
}

const MARGIN = 8;
const MENU_ITEM = "[role^=menuitem]";

/**
 * Context menu of the design system, in the top layer (native popover): closes with Esc
 * or a click outside, moves with the arrow keys and returns the focus when it closes.
 */
function ContextMenu({ position, items, onClose }: { position: Position; items: ContextMenuItem[]; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [placement, setPlacement] = useState(position);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Shows the menu and keeps it inside the window.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    menu.showPopover();
    const { width, height } = menu.getBoundingClientRect();
    setPlacement({
      x: Math.max(MARGIN, Math.min(position.x, window.innerWidth - width - MARGIN)),
      y: Math.max(MARGIN, Math.min(position.y, window.innerHeight - height - MARGIN)),
    });
    menu.querySelector<HTMLElement>(MENU_ITEM)?.focus();

    const handleToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") onCloseRef.current();
    };
    menu.addEventListener("toggle", handleToggle);
    return () => {
      menu.removeEventListener("toggle", handleToggle);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [position]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const menuItems = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(MENU_ITEM) ?? []);
    const index = menuItems.indexOf(document.activeElement as HTMLElement);
    const focusAt = (next: number) => menuItems[(next + menuItems.length) % menuItems.length]?.focus();
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(menuItems.length - 1);
        break;
      case "Tab":
        event.preventDefault();
        menuRef.current?.hidePopover();
        break;
    }
  }

  function run(action: () => void) {
    menuRef.current?.hidePopover();
    action();
  }

  return (
    <div
      ref={menuRef}
      popover="auto"
      role="menu"
      className={styles.menu}
      style={{ left: placement.x, top: placement.y }}
      onKeyDown={handleKeyDown}
      // Clicks inside the menu must not reach the element that opened it.
      onPointerDown={(event) => event.stopPropagation()}
    >
      {items.map((item) => (
        <Fragment key={item.label}>
          {(item.hasSeparatorBefore || (item.kind !== "swatches" && item.isDestructive)) && (
            <div className={styles.separator} role="separator" />
          )}
          {item.kind === "swatches" ? (
            <div role="group" aria-label={item.label} className={styles.swatchGroup}>
              <span className={styles.groupLabel} aria-hidden="true">
                {item.label}
              </span>
              <div className={styles.swatches}>
                {item.options.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    role="menuitemradio"
                    aria-checked={option.value === item.selected}
                    aria-label={option.name}
                    title={option.name}
                    tabIndex={-1}
                    className={cx(styles.swatch, option.color === null && styles.swatchNone)}
                    style={option.color ? { background: option.color } : undefined}
                    onClick={() => run(() => item.onSelect(option.value))}
                  >
                    {option.color === null && <Icon name="xmark" size={10} />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              role={item.isChecked === undefined ? "menuitem" : "menuitemradio"}
              aria-checked={item.isChecked}
              tabIndex={-1}
              className={cx(styles.item, item.isDestructive && styles.destructive)}
              onClick={() => run(item.onSelect)}
            >
              {item.isChecked !== undefined ? (
                <Icon name="checkmark" className={cx(styles.icon, !item.isChecked && styles.hidden)} />
              ) : (
                item.icon && <Icon name={item.icon} className={styles.icon} />
              )}
              {item.label}
            </button>
          )}
        </Fragment>
      ))}
    </div>
  );
}
