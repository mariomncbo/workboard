/**
 * Avatar initials from a full name: first letter of the first name and of the first surname;
 * with a single word, its first two letters. Same rule as the macOS app.
 * "Lucía Ortega" → "LO", "Daniel Ruiz Gómez" → "DR", "Marta" → "MA".
 */
export function initials(fullName: string, locale = "es"): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length === 0
      ? ""
      : words.length === 1
        ? Array.from(words[0]).slice(0, 2).join("")
        : Array.from(words[0])[0] + Array.from(words[1])[0];
  return letters.toLocaleUpperCase(locale);
}
