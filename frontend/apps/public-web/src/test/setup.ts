import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { API_BASE_URL, server } from "./server";

process.env.API_BASE_URL = API_BASE_URL;

// A request without a handler fails the test instead of silently reaching nowhere
// (MSW 3 renamed onUnhandledRequest to onUnhandledFrame)
beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  server.resetHandlers();
  // Only jsdom tests render; Testing Library cleans up on its own only with Vitest globals
  if (typeof document !== "undefined") {
    cleanup();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  }
});

afterAll(() => {
  server.close();
});
