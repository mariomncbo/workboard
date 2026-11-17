"use client";

import { useId } from "react";
import { cx } from "@/lib/cx";
import styles from "./SwatchPicker.module.css";

export type SwatchFill =
  | { kind: "color"; color: string }
  /** "Sin color": empty square with a diagonal line. */
  | { kind: "none" }
  /** Board background with the dot grid. */
  | { kind: "dots" };

export type SwatchOption<Value extends string> = {
  value: Value;
  name: string;
  fill: SwatchFill;
};

type SwatchPickerProps<Value extends string> = {
  label: string;
  options: readonly SwatchOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  /** Text under the swatches; by default, the name of the selected option. */
  caption?: string;
};

/**
 * Row of color squares. Built on native radio buttons, so it works with the arrow keys
 * and screen readers announce each option's name and which one is selected.
 */
export function SwatchPicker<Value extends string>({ label, options, value, onChange, caption }: SwatchPickerProps<Value>) {
  const name = useId();
  const selected = options.find((option) => option.value === value);

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.swatches}>
        {options.map((option) => (
          <label key={option.value} className={styles.swatch} title={option.name}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              aria-label={option.name}
            />
            <span
              className={cx(styles.fill, option.fill.kind === "none" && styles.none, option.fill.kind === "dots" && styles.dots)}
              style={option.fill.kind === "color" ? { background: option.fill.color } : undefined}
              aria-hidden="true"
            />
          </label>
        ))}
      </div>
      <p className={styles.caption}>{caption ?? selected?.name}</p>
    </fieldset>
  );
}
