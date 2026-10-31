import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/securityHeaders";

// Finds the request config at src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // A self-contained server (server.js + only the traced node_modules) for the Docker image (5e decision 2)
  output: "standalone",
  // Trace from the workspace root: the app imports workspace packages that live outside apps/public-web
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  // The OG images and icons read these fonts by path from the app folder (lib/og.tsx). Without this the files
  // reach the image, but not the app's node_modules/@fontsource link to them, and OG images fail (5e decision 3)
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/@fontsource/space-grotesk/files/*.woff",
      "./node_modules/@fontsource/space-mono/files/*.woff",
    ],
  },
  poweredByHeader: false,
  // The workspace packages ship TypeScript source; Next compiles them like app code
  transpilePackages: ["@blog/api-client", "@blog/markdown", "@blog/slug"],
  // §2 names /rss.xml; the feeds are per language (5d decision 3), Turkish being the default
  redirects() {
    return Promise.resolve([{ source: "/rss.xml", destination: "/tr/rss.xml", permanent: true }]);
  },
  headers() {
    return Promise.resolve([
      { source: "/(.*)", headers: securityHeaders(process.env.NODE_ENV === "development") },
    ]);
  },
  // Images (covers, markdown) are served from this origin and fetched from the backend behind it, so the
  // browser never talks to the API and img-src 'self' holds (5c decision 6). The destination is fixed at
  // build time: the Docker build passes API_BASE_URL (5e decision 4).
  rewrites() {
    return Promise.resolve([
      { source: "/api/public/media/:file", destination: `${apiBaseUrl}/api/public/media/:file` },
    ]);
  },
};

export default withNextIntl(nextConfig);
