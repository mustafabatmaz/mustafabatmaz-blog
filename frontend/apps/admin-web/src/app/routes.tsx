import { Navigate, type RouteObject } from "react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { NotFound } from "@/components/layout/NotFound";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { tr } from "@/i18n/tr";

// Exported so tests can mount the same tree in a memory router
export const routes: RouteObject[] = [
  { path: "/login", Component: LoginPage },
  {
    // Layout routes without a path: the guard first, then the shell
    Component: RequireAuth,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, element: <Navigate to="/posts" replace /> },
          // Each section replaces its placeholder in its own sub-phase (4b–4e)
          { path: "posts", element: <ComingSoon title={tr.nav.posts} /> },
          { path: "media", element: <ComingSoon title={tr.nav.media} /> },
          { path: "experience", element: <ComingSoon title={tr.nav.experience} /> },
          { path: "pages", element: <ComingSoon title={tr.nav.pages} /> },
          { path: "uses", element: <ComingSoon title={tr.nav.uses} /> },
          { path: "profile", element: <ComingSoon title={tr.nav.profile} /> },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
];
