import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

/** The landing is public; the app and the sign-in screens are not useful in search results. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/app", "/auth", "/dev", "/restablecer-contrasena"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
