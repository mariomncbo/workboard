import type { Metadata } from "next";
import { HomeScreen } from "@/components/home/HomeScreen";
import { boardRepository } from "@/lib/data/boards";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mi espacio de trabajo",
};

/** Home. The boards are read on the server, so the page arrives with them. */
export default async function HomePage() {
  const repository = boardRepository(await createClient());
  const [boards, summaries] = await Promise.all([repository.fetchBoards(), repository.fetchSummaries()]);
  return <HomeScreen initialBoards={boards} initialSummaries={summaries} />;
}
