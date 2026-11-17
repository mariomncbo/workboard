/** Joins class names, skipping empty values: `cx(styles.a, isOn && styles.b)`. */
export function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}
