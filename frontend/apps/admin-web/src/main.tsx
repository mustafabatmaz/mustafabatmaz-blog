import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "./app/AppProviders";
import { createQueryClient } from "./app/queryClient";
import { routes } from "./app/routes";
import { applyTheme, readStoredTheme } from "./features/theme/theme";
import "./index.css";

// Applied before the first render so a dark-theme user doesn't see the light theme flash first
applyTheme(readStoredTheme());

// Created once, outside React: the router and the cache must survive re-renders
const router = createBrowserRouter(routes);
const queryClient = createQueryClient();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Element #root is missing from index.html");
}

createRoot(root).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
