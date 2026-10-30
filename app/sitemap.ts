import type { MetadataRoute } from "next";
import { EXAMPLES } from "@/lib/examples";
import { SITE_URL } from "@/lib/site";

// The pages worth finding in search: the home page, the builder, the resume examples, and the
// privacy and terms pages
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/builder`, priority: 0.8 },
    { url: `${SITE_URL}/examples`, priority: 0.8 },
    ...EXAMPLES.map((example) => ({ url: `${SITE_URL}/examples/${example.slug}`, priority: 0.7 })),
    { url: `${SITE_URL}/privacy`, priority: 0.3 },
    { url: `${SITE_URL}/terms`, priority: 0.3 },
  ];
}
