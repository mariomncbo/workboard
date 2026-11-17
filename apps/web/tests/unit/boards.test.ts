import { describe, expect, test } from "vitest";
import {
  EMPTY_BOARD_DRAFT,
  boardDeletionMessage,
  boardSummaryText,
  draftFromBoard,
  isBoardDraftValid,
  sortAndFilterBoards,
  type Board,
} from "@/lib/data/boards";

const board = (name: string, isFavorite: boolean, createdAt: string): Board => ({
  id: name,
  name,
  description: null,
  background: "dots",
  isFavorite,
  createdAt,
});

describe("tableros", () => {
  const boards = [
    board("Marketing Q1", false, "2026-11-01T10:00:00Z"),
    board("Investigación", false, "2026-11-03T10:00:00Z"),
    board("Lanzamiento v2", true, "2026-10-01T10:00:00Z"),
  ];

  test("los favoritos van primero y después los más nuevos", () => {
    expect(sortAndFilterBoards(boards, "").map((b) => b.name)).toEqual(["Lanzamiento v2", "Investigación", "Marketing Q1"]);
  });

  test("la búsqueda no distingue mayúsculas ni tildes", () => {
    expect(sortAndFilterBoards(boards, "INVESTIGACION").map((b) => b.name)).toEqual(["Investigación"]);
    expect(sortAndFilterBoards(boards, "  lanza ").map((b) => b.name)).toEqual(["Lanzamiento v2"]);
    expect(sortAndFilterBoards(boards, "zzz")).toEqual([]);
  });

  test("resumen de listas y tareas", () => {
    expect(boardSummaryText({ listCount: 0, taskCount: 0 })).toBe("Sin listas");
    expect(boardSummaryText({ listCount: 1, taskCount: 1 })).toBe("1 lista · 1 tarea");
    expect(boardSummaryText({ listCount: 4, taskCount: 23 })).toBe("4 listas · 23 tareas");
  });

  test("el mensaje de borrado dice lo que se pierde", () => {
    expect(boardDeletionMessage({ listCount: 0, taskCount: 0 })).toBe("Se borrará el tablero. Esta acción no se puede deshacer.");
    expect(boardDeletionMessage({ listCount: 1, taskCount: 1 })).toBe(
      "Se borrarán el tablero, su lista y su tarea. Esta acción no se puede deshacer.",
    );
    expect(boardDeletionMessage({ listCount: 3, taskCount: 0 })).toContain("sus 3 listas y sus 0 tareas");
  });

  test("el nombre es obligatorio y tiene un máximo de 100 caracteres", () => {
    expect(isBoardDraftValid(EMPTY_BOARD_DRAFT)).toBe(false);
    expect(isBoardDraftValid({ ...EMPTY_BOARD_DRAFT, name: "   " })).toBe(false);
    expect(isBoardDraftValid({ ...EMPTY_BOARD_DRAFT, name: "Viaje" })).toBe(true);
    expect(isBoardDraftValid({ ...EMPTY_BOARD_DRAFT, name: "a".repeat(101) })).toBe(false);
    expect(isBoardDraftValid({ ...EMPTY_BOARD_DRAFT, name: "Viaje", description: "a".repeat(2001) })).toBe(false);
  });

  test("el borrador de un tablero sin descripción la deja vacía", () => {
    expect(draftFromBoard(boards[2])).toEqual({ name: "Lanzamiento v2", description: "", background: "dots", isFavorite: true });
  });
});
