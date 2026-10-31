// @ts-check
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/dist", "**/coverage", "**/src/schema.d.ts", "**/.next", "**/next-env.d.ts"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite(),
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Next's own rules (next/link over <a>, next/image hints, Core Web Vitals) for the public site only
    files: ["apps/public-web/**/*.{ts,tsx}"],
    ...nextPlugin.configs["core-web-vitals"],
  },
  {
    // Next requires default exports from these files (page.tsx, layout.tsx, error.tsx ...) and reads the
    // route config they export (revalidate, generateStaticParams) next to the component; og.tsx draws share
    // images on the server and is never hot-reloaded in the browser
    files: ["apps/public-web/src/app/**/*.tsx", "apps/public-web/src/lib/og.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // shadcn components export their variant helpers (buttonVariants) next to the component by design
    files: ["**/src/components/ui/**"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Last, so formatting is left entirely to Prettier
  prettier,
]);
