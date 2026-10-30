import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The pages worth finding in search: the home page, the builder and the privacy page
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/builder`, priority: 0.8 },
    { url: `${SITE_URL}/privacy`, priority: 0.3 },
  ];
}
