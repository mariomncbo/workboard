import { describe, expect, test } from "vitest";
import { positionAfter, positionAt, positionBetween } from "@/lib/data/position";

describe("posiciones fraccionarias", () => {
  test("entre dos elementos, el punto medio", () => {
    expect(positionBetween(1, 2)).toBe(1.5);
  });

  test("al final, uno más que el último; al principio, uno menos que el primero", () => {
    expect(positionBetween(3, null)).toBe(4);
    expect(positionBetween(null, 3)).toBe(2);
  });

  test("en una lista vacía, 1", () => {
    expect(positionBetween(null, null)).toBe(1);
    expect(positionAfter(null)).toBe(1);
  });

  test("añadir al final suma uno al último", () => {
    expect(positionAfter(2.5)).toBe(3.5);
  });

  test("la posición de un elemento movido sale de sus nuevos vecinos", () => {
    const ordered = [{ position: 1 }, { position: 9 }, { position: 2 }];
    expect(positionAt(ordered, 1)).toBe(1.5);
    expect(positionAt(ordered, 0)).toBe(8);
    expect(positionAt(ordered, 2)).toBe(10);
  });

  test("mover muchas veces entre dos vecinos sigue dejando el orden correcto", () => {
    let previous = 1;
    const next = 2;
    for (let i = 0; i < 40; i++) {
      const middle = positionBetween(previous, next);
      expect(middle).toBeGreaterThan(previous);
      expect(middle).toBeLessThan(next);
      previous = middle;
    }
  });
});
