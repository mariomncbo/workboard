import { describe, expect, test } from "vitest";
import { initials } from "@/lib/initials";

describe("initials", () => {
  test.each([
    ["Lucía Ortega", "LO"],
    ["Daniel Ruiz Gómez", "DR"],
    ["  lucía    ortega  ", "LO"],
    ["Óscar Ñúñez", "ÓÑ"],
  ])("nombre y primer apellido: %s → %s", (fullName, expected) => {
    expect(initials(fullName)).toBe(expected);
  });

  test("una sola palabra: sus dos primeras letras", () => {
    expect(initials("Marta")).toBe("MA");
    expect(initials("a")).toBe("A");
  });

  test("sin nombre, sin iniciales", () => {
    expect(initials("")).toBe("");
    expect(initials("   ")).toBe("");
  });
});
