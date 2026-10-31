import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Finds the request config at src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // The workspace packages ship TypeScript source; Next compiles them like app code
  transpilePackages: ["@blog/api-client", "@blog/markdown", "@blog/slug"],
  // Images (covers, markdown) are served from this origin and fetched from the backend behind it, so the
  // browser never talks to the API and img-src 'self' holds (5c decision 6). The destination is fixed at
  // build time: the Docker build passes API_BASE_URL (5e).
  // §2 names /rss.xml; the feeds are per language (5d decision 3), Turkish being the default
  redirects() {
    return Promise.resolve([{ source: "/rss.xml", destination: "/tr/rss.xml", permanent: true }]);
  },
  rewrites() {
    return Promise.resolve([
      { source: "/api/public/media/:file", destination: `${apiBaseUrl}/api/public/media/:file` },
    ]);
  },
};

export default withNextIntl(nextConfig);
