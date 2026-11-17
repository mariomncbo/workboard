"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { FieldMessage, type FieldMessageValue } from "./FieldMessage";
import styles from "./FormField.module.css";

type FormFieldProps = Omit<ComponentPropsWithRef<"input">, "id"> & {
  label: string;
  message?: FieldMessageValue;
  /** Shown at the end of the label row, such as "¿Olvidaste la contraseña?". */
  accessory?: ReactNode;
};

/**
 * Labeled text field of the design system, with an optional help or error message. The
 * label, the message and the error state are wired for assistive technologies.
 */
export function FormField({ label, message, accessory, className, ...inputProps }: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const isError = message?.kind === "error";

  return (
    <div className={cx(styles.field, className)}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {accessory}
      </div>
      <input
        id={id}
        className={cx(styles.input, isError && styles.invalid)}
        aria-invalid={isError || undefined}
        aria-describedby={message ? messageId : undefined}
        {...inputProps}
      />
      {message && <FieldMessage id={messageId} message={message} />}
    </div>
  );
}
