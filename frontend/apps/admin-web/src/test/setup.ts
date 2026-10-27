import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

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
