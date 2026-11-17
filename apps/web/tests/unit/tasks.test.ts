import { describe, expect, test } from "vitest";
import { groupTasks } from "@/components/board/useBoard";
import type { BoardList } from "@/lib/data/lists";
import { cleanTaskName, draftFromTask, isTaskDraftValid, type BoardTask } from "@/lib/data/tasks";

const task = (id: string, listId: string, position: number): BoardTask => ({
  id,
  listId,
  name: id,
  description: null,
  color: null,
  position,
});

describe("tareas", () => {
  test("el nombre es un solo párrafo: los saltos de línea pasan a ser espacios", () => {
    expect(cleanTaskName("  Revisar\nel registro\r\n ")).toBe("Revisar el registro");
  });

  test("el nombre es obligatorio y tiene un máximo de 500 caracteres", () => {
    expect(isTaskDraftValid({ name: " ", description: "", color: null })).toBe(false);
    expect(isTaskDraftValid({ name: "a".repeat(500), description: "", color: "blue" })).toBe(true);
    expect(isTaskDraftValid({ name: "a".repeat(501), description: "", color: null })).toBe(false);
    expect(isTaskDraftValid({ name: "Tarea", description: "a".repeat(10001), color: null })).toBe(false);
  });

  test("el borrador de una tarea sin descripción la deja vacía", () => {
    expect(draftFromTask(task("A", "l1", 1))).toEqual({ name: "A", description: "", color: null });
  });

  test("las tareas se agrupan por lista y en orden; las listas sin tareas quedan vacías", () => {
    const lists = [{ id: "l1" }, { id: "l2" }, { id: "l3" }] as BoardList[];
    const grouped = groupTasks(lists, [task("C", "l1", 3), task("A", "l1", 1), task("B", "l2", 2), task("X", "otra", 1)]);
    expect(grouped.l1.map((t) => t.id)).toEqual(["A", "C"]);
    expect(grouped.l2.map((t) => t.id)).toEqual(["B"]);
    expect(grouped.l3).toEqual([]);
    expect(grouped).not.toHaveProperty("otra");
  });
});
