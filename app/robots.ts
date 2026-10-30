import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines may read every page, but not the AI routes behind the buttons
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
