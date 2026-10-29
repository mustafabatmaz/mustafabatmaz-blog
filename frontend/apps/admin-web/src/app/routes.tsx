import { Navigate, type RouteObject } from "react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { NotFound } from "@/components/layout/NotFound";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { ExperiencePage } from "@/features/experience/ExperiencePage";
import { ProjectPage } from "@/features/experience/ProjectPage";
import { PagesPage } from "@/features/pages/PagesPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { UsesPage } from "@/features/uses/UsesPage";
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
          { path: "experience", Component: ExperiencePage },
          { path: "experience/projects/:id", Component: ProjectPage },
          { path: "experience/:experienceId/projects/new", Component: ProjectPage },
          {
            path: "pages",
            children: [
              { index: true, element: <Navigate to="about" replace /> },
              { path: ":slug", Component: PagesPage },
            ],
          },
          { path: "uses", Component: UsesPage },
          { path: "profile", Component: ProfilePage },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
];
