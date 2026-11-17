import { describe, expect, test } from "vitest";
import { emailIssue, fullNameIssue, nicknameIssue, normalizeNickname, passwordIssue } from "@/lib/auth/registrationRules";

describe("reglas de registro", () => {
  test("el nickname se guarda en minúsculas, sin espacios ni «@»", () => {
    expect(normalizeNickname("  @LOrtega ")).toBe("lortega");
    expect(normalizeNickname("Daniel.Ruiz_2")).toBe("daniel.ruiz_2");
  });

  test.each(["abc", "lortega", "daniel.ruiz_2", "a".repeat(30)])("nickname válido: %s", (nickname) => {
    expect(nicknameIssue(nickname)).toBeNull();
  });

  test.each(["", "ab", "con espacio", "lucía", "guion-medio", "@arroba", "a".repeat(31)])(
    "nickname no válido: «%s»",
    (nickname) => {
      expect(nicknameIssue(nickname)).not.toBeNull();
    },
  );

  test.each(["lucia@ejemplo.com", "  a.b+c@dominio.es  "])("correo válido: %s", (email) => {
    expect(emailIssue(email)).toBeNull();
  });

  test.each(["", "lucia", "lucia@", "lucia@ejemplo", "@ejemplo.com", "lu cia@ejemplo.com"])(
    "correo no válido: «%s»",
    (email) => {
      expect(emailIssue(email)).not.toBeNull();
    },
  );

  test("la contraseña necesita al menos 8 caracteres", () => {
    expect(passwordIssue("1234567")).not.toBeNull();
    expect(passwordIssue("12345678")).toBeNull();
  });

  test("el nombre no puede estar vacío ni pasar de 100 caracteres", () => {
    expect(fullNameIssue("   ")).not.toBeNull();
    expect(fullNameIssue("Lucía Ortega")).toBeNull();
    expect(fullNameIssue("a".repeat(101))).not.toBeNull();
  });
});
