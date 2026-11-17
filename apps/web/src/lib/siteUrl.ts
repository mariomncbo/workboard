/** Public address of the website (NEXT_PUBLIC_SITE_URL), or the local server while developing. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
