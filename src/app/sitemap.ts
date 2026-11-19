import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/try`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/legal`, lastModified, changeFrequency: "monthly", priority: 0.3 },
  ];
}
