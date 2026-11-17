import { paletteVar, type BoardBackground } from "@/lib/palette";
import styles from "./home.module.css";

/** Top strip of a board card: the board color, or the dot grid. */
export function BoardCover({ background, height }: { background: BoardBackground; height: number }) {
  return (
    <div
      className={background === "dots" ? `${styles.cover} ${styles.coverDots}` : styles.cover}
      style={{ height, background: background === "dots" ? undefined : paletteVar(background) }}
      aria-hidden="true"
    />
  );
}
