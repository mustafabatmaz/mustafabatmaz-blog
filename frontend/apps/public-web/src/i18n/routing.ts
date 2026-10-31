import type { Schemas } from "@blog/api-client";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // The backend's languages: a new one there fails typecheck here until the site supports it
  locales: ["tr", "en"] satisfies Schemas["ProfileResponse"]["lang"][],
  defaultLocale: "tr",
  // next-intl would derive the other language's address by swapping the prefix, but post slugs differ per
  // language; the right hreflang links come from each page's metadata instead (5a decision 4)
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
