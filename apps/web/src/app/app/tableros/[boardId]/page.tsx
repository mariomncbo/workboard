import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BoardScreen } from "@/components/board/BoardScreen";
import { boardRepository } from "@/lib/data/boards";
import { listRepository } from "@/lib/data/lists";
import { taskRepository } from "@/lib/data/tasks";
import { createClient } from "@/lib/supabase/server";

/** The board, read once per request for both the title and the page. */
const loadBoard = cache(async (boardId: string) => {
  const supabase = await createClient();
  return boardRepository(supabase).fetchBoard(boardId);
});

export async function generateMetadata({ params }: PageProps<"/app/tableros/[boardId]">): Promise<Metadata> {
  const board = await loadBoard((await params).boardId);
  return { title: board?.name ?? "Tablero" };
}

/** An open board. The board, its lists and its tasks are read on the server. */
export default async function BoardPage({ params }: PageProps<"/app/tableros/[boardId]">) {
  const { boardId } = await params;
  const board = await loadBoard(boardId);
  // Also when it belongs to someone else: Row Level Security hides it.
  if (!board) notFound();

  const supabase = await createClient();
  const lists = await listRepository(supabase).fetchLists(board.id);
  const tasks = await taskRepository(supabase).fetchTasks(lists.map((list) => list.id));

  return <BoardScreen board={board} lists={lists} tasks={tasks} />;
}
