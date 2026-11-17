/**
 * Supabase connection settings. Both values are public: the URL and the publishable key
 * are meant for the browser, and Row Level Security protects the data. The secret key is
 * never used in this app.
 */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.local y rellénalo.",
    );
  }
  return { url, publishableKey };
}
