import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Demo account and example boards for the landing video and screenshots. The account is
 * created if it does not exist; its boards are deleted and created again on every run, so
 * the result is always the same.
 */

type Color = "blue" | "teal" | "green" | "lime" | "amber" | "orange" | "red" | "pink" | "violet" | "graphite";
type TaskSeed = string | [string, Color];
type ListSeed = { name: string; style: "light" | "dark"; tasks: TaskSeed[] };
type BoardSeed = { name: string; background: "dots" | Color; isFavorite?: boolean; description?: string; lists: ListSeed[] };

export const DEMO_PROFILE = { fullName: "Lucía Ortega", nickname: "lortega" };

/** The board shown in the video and in most screenshots. */
export const MAIN_BOARD = "Lanzamiento v2";

// Oldest first: Home sorts favorites first and then the newest.
const BOARDS: BoardSeed[] = [
  {
    name: "Viaje de equipo",
    background: "green",
    lists: [
      { name: "Ideas", style: "light", tasks: ["Elegir destino", ["Pedir presupuestos", "amber"]] },
      { name: "Reservado", style: "dark", tasks: ["Fechas cerradas"] },
    ],
  },
  {
    name: "Investigación",
    background: "dots",
    lists: [
      { name: "Preguntas", style: "light", tasks: ["¿Qué tableros usa cada equipo?", "Entrevistas a cinco usuarios"] },
      { name: "Hallazgos", style: "dark", tasks: [["Los colores ayudan a priorizar", "violet"]] },
    ],
  },
  {
    name: "Mudanza de oficina",
    background: "teal",
    lists: [
      { name: "Por hacer", style: "light", tasks: ["Inventario del material", "Contratar la mudanza", ["Avisar al equipo", "orange"]] },
      { name: "Hecho", style: "dark", tasks: ["Firmar el contrato", "Planos de la nueva oficina"] },
    ],
  },
  {
    name: "Marketing Q1",
    background: "amber",
    lists: [
      { name: "Campañas", style: "light", tasks: ["Boletín de enero", ["Lanzamiento en redes", "pink"], "Vídeo de producto"] },
      { name: "En curso", style: "dark", tasks: ["Calendario de publicaciones", ["Nueva web", "blue"]] },
      { name: "Publicado", style: "light", tasks: ["Nota de prensa"] },
    ],
  },
  {
    name: "Diseño de producto",
    background: "violet",
    isFavorite: true,
    lists: [
      { name: "Bocetos", style: "light", tasks: ["Pantalla de Inicio", ["Modal de tarea", "teal"], "Menú de usuario"] },
      { name: "Revisión", style: "dark", tasks: [["Paneles laterales", "amber"], "Barra flotante"] },
      { name: "Aprobado", style: "light", tasks: ["Sistema de diseño", "Logotipo"] },
    ],
  },
  {
    name: MAIN_BOARD,
    background: "dots",
    isFavorite: true,
    description: "Todo lo que falta para publicar la versión 2.",
    lists: [
      {
        name: "Por hacer",
        style: "light",
        tasks: [
          "Revisar el flujo de registro",
          ["Definir los colores de las tareas", "amber"],
          "Preparar notas de la versión",
          ["Escribir el README", "pink"],
          "Probar con «Reducir movimiento»",
          "Revisar los textos de la web",
        ],
      },
      {
        name: "En curso",
        style: "dark",
        tasks: ["Pantalla de Login", ["Esquema de la base de datos", "green"], "Cuentas recientes", ["Arrastrar y soltar", "blue"]],
      },
      { name: "Revisión", style: "light", tasks: [["Iconos de la barra flotante", "teal"], "Menú contextual", "Paneles laterales"] },
      {
        name: "Hecho",
        style: "dark",
        tasks: ["Elegir el nombre del proyecto", "Sistema de diseño", ["Crear el repositorio", "graphite"], "Logotipo", ["Fondo de puntos animado", "violet"]],
      },
    ],
  },
];

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Faltan las variables de Supabase en .env.local.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function demoCredentials() {
  const email = process.env.LANDING_DEMO_EMAIL;
  const password = process.env.LANDING_DEMO_PASSWORD;
  if (!email || !password) throw new Error("Faltan LANDING_DEMO_EMAIL y LANDING_DEMO_PASSWORD en .env.local.");
  return { email, password };
}

/** Signs in to the demo account, creating it the first time. */
async function signInDemo(): Promise<SupabaseClient> {
  const supabase = client();
  const { email, password } = demoCredentials();
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error) return supabase;
  const signUp = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: DEMO_PROFILE.fullName, nickname: DEMO_PROFILE.nickname } },
  });
  if (signUp.error) throw signUp.error;
  return supabase;
}

/** Deletes the demo boards and creates the example ones again. */
export async function resetDemoContent() {
  const supabase = await signInDemo();
  const removal = await supabase.from("boards").delete().not("id", "is", null);
  if (removal.error) throw removal.error;

  for (const [index, board] of BOARDS.entries()) {
    const created = await supabase
      .from("boards")
      .insert({
        name: board.name,
        description: board.description ?? null,
        background: board.background,
        is_favorite: board.isFavorite ?? false,
        // Spread creation times so "newest first" is stable.
        created_at: new Date(Date.now() - (BOARDS.length - index) * 60_000).toISOString(),
      })
      .select("id")
      .single();
    if (created.error) throw created.error;

    for (const [listIndex, list] of board.lists.entries()) {
      const createdList = await supabase
        .from("board_lists")
        .insert({ board_id: created.data.id, name: list.name, style: list.style, position: listIndex + 1 })
        .select("id")
        .single();
      if (createdList.error) throw createdList.error;
      const tasks = list.tasks.map((task, taskIndex) => {
        const [name, color] = typeof task === "string" ? [task, null] : task;
        return { list_id: createdList.data.id, name, color, position: taskIndex + 1 };
      });
      const insertedTasks = await supabase.from("board_tasks").insert(tasks);
      if (insertedTasks.error) throw insertedTasks.error;
    }
  }
  await supabase.auth.signOut();
}
