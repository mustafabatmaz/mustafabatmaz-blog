import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Everything may be crawled; 404 pages carry noindex on their own (5d decision 6). Per request, so the
// sitemap address follows SITE_URL rather than whatever the build saw.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
