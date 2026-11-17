/**
 * The 10 user colors for boards and tasks (`palette-*` tokens). The values match the
 * `palette_color` enum in the database. Text on top is always `--on-palette`.
 */
export const PALETTE_COLORS = [
  "blue",
  "teal",
  "green",
  "lime",
  "amber",
  "orange",
  "red",
  "pink",
  "violet",
  "graphite",
] as const;

export type PaletteColor = (typeof PALETTE_COLORS)[number];

export const PALETTE_COLOR_NAMES: Record<PaletteColor, string> = {
  blue: "Azul",
  teal: "Turquesa",
  green: "Verde",
  lime: "Lima",
  amber: "Ámbar",
  orange: "Naranja",
  red: "Rojo",
  pink: "Rosa",
  violet: "Violeta",
  graphite: "Grafito",
};

/** CSS color of a palette color: `var(--palette-blue)`. */
export function paletteVar(color: PaletteColor): string {
  return `var(--palette-${color})`;
}

/** Background of a board: the dot grid or a palette color. Stored as `"dots"` or the color. */
export type BoardBackground = "dots" | PaletteColor;

export const BOARD_BACKGROUNDS: readonly BoardBackground[] = ["dots", ...PALETTE_COLORS];

export function boardBackgroundName(background: BoardBackground): string {
  return background === "dots" ? "Cuadrícula de puntos" : PALETTE_COLOR_NAMES[background];
}
