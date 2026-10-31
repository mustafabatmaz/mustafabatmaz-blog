import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Finds the request config at src/i18n/request.ts
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // The workspace packages ship TypeScript source; Next compiles them like app code
  transpilePackages: ["@blog/api-client", "@blog/markdown"],
};

export default withNextIntl(nextConfig);
