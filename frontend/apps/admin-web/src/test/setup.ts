import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

// findBy*/waitFor give up after 1 s by default. The first test in a file also loads the lazy route's modules,
// which took ~1.3 s on a CI runner (about 3x slower than locally) and failed a test that passes in 0.4 s here.
configure({ asyncUtilTimeout: 3000 });

// A request without a handler fails the test instead of silently reaching nowhere
// (MSW 3 renamed onUnhandledRequest to onUnhandledFrame)
beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  // Testing Library only cleans up on its own when Vitest globals are enabled; we import them explicitly
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }
});

afterAll(() => {
  server.close();
});
