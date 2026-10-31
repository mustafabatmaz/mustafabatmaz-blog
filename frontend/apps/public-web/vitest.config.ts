import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Most of this app runs on the server; Client Component tests opt into jsdom with a file comment
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // next-intl's ESM build imports "next/server" without a file extension, which Node's own resolver rejects;
    // letting Vite resolve it fixes that
    server: { deps: { inline: ["next-intl"] } },
  },
});
