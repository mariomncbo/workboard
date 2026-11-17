/**
 * Positions for ordered items (lists and tasks). An item moved between two others gets the
 * midpoint of their positions, so no other row has to be rewritten. Same rule as macOS.
 */
export function positionBetween(previous: number | null, next: number | null): number {
  if (previous !== null && next !== null) return (previous + next) / 2;
  if (previous !== null) return previous + 1;
  if (next !== null) return next - 1;
  return 1;
}

/** Position for an item added at the end. */
export function positionAfter(last: number | null): number {
  return (last ?? 0) + 1;
}

/** Position of the item at `index` of `ordered`, from its neighbors in that order. */
export function positionAt<T extends { position: number }>(ordered: T[], index: number): number {
  const previous = index > 0 ? ordered[index - 1].position : null;
  const next = index < ordered.length - 1 ? ordered[index + 1].position : null;
  return positionBetween(previous, next);
}
