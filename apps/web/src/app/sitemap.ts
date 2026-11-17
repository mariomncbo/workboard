import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl()}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl()}/registro`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${siteUrl()}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
