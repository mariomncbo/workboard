/**
 * Validation of the sign-up form. Same rules as the macOS app and the database constraints,
 * so most problems are caught before sending anything. Each check returns the message to
 * show, or `null` when the value is valid.
 */

export const MINIMUM_PASSWORD_LENGTH = 8;

/** Lowercase, without spaces or a leading "@", as stored in the database. */
export function normalizeNickname(nickname: string): string {
  let normalized = nickname.trim().toLocaleLowerCase("es");
  if (normalized.startsWith("@")) normalized = normalized.slice(1);
  return normalized;
}

export function fullNameIssue(fullName: string): string | null {
  const trimmed = fullName.trim();
  if (!trimmed) return "Escribe tu nombre y apellidos.";
  if (Array.from(trimmed).length > 100) return "Máximo 100 caracteres.";
  return null;
}

export function emailIssue(email: string): string | null {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? null : "Escribe un correo válido, como nombre@ejemplo.com.";
}

/** Checks an already normalized nickname: 3–30 characters, a–z, 0–9, "_" or ".". */
export function nicknameIssue(normalizedNickname: string): string | null {
  return /^[a-z0-9_.]{3,30}$/.test(normalizedNickname)
    ? null
    : "Usa de 3 a 30 caracteres: letras sin tildes, números, «_» o «.».";
}

export function passwordIssue(password: string): string | null {
  return Array.from(password).length < MINIMUM_PASSWORD_LENGTH ? "Mínimo 8 caracteres." : null;
}
