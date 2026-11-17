"use client";

import { useId, type TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import fieldStyles from "./FormField.module.css";
import styles from "./FormTextArea.module.css";

type FormTextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  /** Shown after the label in a lighter color, such as "(opcional)". */
  note?: string;
};

/** Multi-line version of `FormField`, for descriptions. */
export function FormTextArea({ label, note, className, rows = 3, ...props }: FormTextAreaProps) {
  const id = useId();
  return (
    <div className={cx(fieldStyles.field, className)}>
      <label className={fieldStyles.label} htmlFor={id}>
        {label}
        {note && <span className={styles.note}> {note}</span>}
      </label>
      <textarea id={id} rows={rows} className={cx(fieldStyles.input, styles.textarea)} {...props} />
    </div>
  );
}
