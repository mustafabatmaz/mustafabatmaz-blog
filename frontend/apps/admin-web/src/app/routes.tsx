import { Navigate, type RouteObject } from "react-router";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { NotFound } from "@/components/layout/NotFound";
import { Loading } from "@/components/layout/QueryState";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";

// Login, the session guard and the shell are in the main bundle; each section loads its own chunk on first
// visit (like loadComponent in Angular routes). The router waits for the chunk before switching screens.
export const routes: RouteObject[] = [
  { path: "/login", Component: LoginPage },
  {
    // Layout routes without a path: the guard first, then the shell
    Component: RequireAuth,
    // Shown while the first screen's chunk loads on a full page load
    HydrateFallback: Loading,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, element: <Navigate to="/posts" replace /> },
          {
            path: "posts",
            lazy: async () => ({
              Component: (await import("@/features/posts/PostsPage")).PostsPage,
            }),
          },
          {
            path: "posts/new",
            lazy: async () => ({ Component: (await import("@/features/posts/PostPage")).PostPage }),
          },
          {
            path: "posts/:id",
            lazy: async () => ({ Component: (await import("@/features/posts/PostPage")).PostPage }),
          },
          {
            path: "media",
            lazy: async () => ({
              Component: (await import("@/features/media/MediaPage")).MediaPage,
            }),
          },
          {
            path: "experience",
            lazy: async () => ({
              Component: (await import("@/features/experience/ExperiencePage")).ExperiencePage,
            }),
          },
          {
            path: "experience/projects/:id",
            lazy: async () => ({
              Component: (await import("@/features/experience/ProjectPage")).ProjectPage,
            }),
          },
          {
            path: "experience/:experienceId/projects/new",
            lazy: async () => ({
              Component: (await import("@/features/experience/ProjectPage")).ProjectPage,
            }),
          },
          {
            path: "pages",
            children: [
              { index: true, element: <Navigate to="about" replace /> },
              {
                path: ":slug",
                lazy: async () => ({
                  Component: (await import("@/features/pages/PagesPage")).PagesPage,
                }),
              },
            ],
          },
          {
            path: "uses",
            lazy: async () => ({ Component: (await import("@/features/uses/UsesPage")).UsesPage }),
          },
          {
            path: "profile",
            lazy: async () => ({
              Component: (await import("@/features/profile/ProfilePage")).ProfilePage,
            }),
          },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
];
