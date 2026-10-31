import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Runs before routing (Next 16 renamed middleware to proxy). Prefixed paths pass through; "/" and other paths
// without a language get one: the NEXT_LOCALE cookie, then Accept-Language, then Turkish (5a decision 4).
export const proxy = createMiddleware(routing);

export const config = {
  // Not for the API, Next's own files, the root icons or anything with a file extension (favicon.ico,
  // robots.txt, sitemap.xml, images)
  matcher: "/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)",
};
