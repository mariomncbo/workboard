"use client";

import {
  BOARD_BACKGROUNDS,
  PALETTE_COLORS,
  PALETTE_COLOR_NAMES,
  boardBackgroundName,
  paletteVar,
  type BoardBackground,
  type PaletteColor,
} from "@/lib/palette";
import { SwatchPicker, type SwatchOption } from "./SwatchPicker";

const NO_COLOR = "none";

const TASK_COLOR_OPTIONS: SwatchOption<PaletteColor | typeof NO_COLOR>[] = [
  { value: NO_COLOR, name: "Sin color", fill: { kind: "none" } },
  ...PALETTE_COLORS.map((color) => ({ value: color, name: PALETTE_COLOR_NAMES[color], fill: { kind: "color" as const, color: paletteVar(color) } })),
];

const BOARD_BACKGROUND_OPTIONS: SwatchOption<BoardBackground>[] = BOARD_BACKGROUNDS.map((background) => ({
  value: background,
  name: boardBackgroundName(background),
  fill: background === "dots" ? { kind: "dots" } : { kind: "color", color: paletteVar(background) },
}));

/** Color of a task: the 10 palette colors, or "Sin color" (`null`). */
export function PaletteColorPicker({ value, onChange }: { value: PaletteColor | null; onChange: (color: PaletteColor | null) => void }) {
  return (
    <SwatchPicker
      label="Color"
      options={TASK_COLOR_OPTIONS}
      value={value ?? NO_COLOR}
      onChange={(selected) => onChange(selected === NO_COLOR ? null : selected)}
    />
  );
}

/** Background of a board: the dot grid or one of the 10 palette colors. */
export function BoardBackgroundPicker({ value, onChange }: { value: BoardBackground; onChange: (background: BoardBackground) => void }) {
  return (
    <SwatchPicker
      label="Fondo"
      options={BOARD_BACKGROUND_OPTIONS}
      value={value}
      onChange={onChange}
      caption={`${boardBackgroundName(value)}. La cuadrícula de puntos usa el fondo animado de la app.`}
    />
  );
}
