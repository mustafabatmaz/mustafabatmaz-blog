import { Link, NavLink, Outlet } from "react-router";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/useLogout";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { tr } from "@/i18n/tr";
import { Monogram } from "./Monogram";

const menu = [
  {
    label: tr.nav.content,
    items: [
      { to: "/posts", label: tr.nav.posts },
      { to: "/media", label: tr.nav.media },
    ],
  },
  {
    label: tr.nav.profileGroup,
    items: [
      { to: "/experience", label: tr.nav.experience },
      { to: "/pages", label: tr.nav.pages },
      { to: "/uses", label: tr.nav.uses },
      { to: "/profile", label: tr.nav.profile },
    ],
  },
];

// Side menu + content, from the approved admin draft. On narrow screens the menu wraps above the content.
export function AdminLayout() {
  const logout = useLogout();
  return (
    <div className="flex min-h-svh flex-wrap">
      <aside className="flex max-w-full grow basis-60 flex-col gap-7 border-r bg-sidebar px-4 py-6">
        <Link
          to="/posts"
          aria-label={tr.app.home}
          className="flex items-center gap-3 rounded-full px-2 text-foreground"
        >
          <Monogram />
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{tr.app.owner}</span>
            <span className="font-mono text-xs text-link">/admin</span>
          </span>
        </Link>

        <nav aria-label={tr.nav.label} className="flex flex-col gap-5">
          {menu.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <span className="px-3 pb-1.5 font-mono text-xs text-muted-foreground">
                {group.label}
              </span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex h-10 items-center rounded-full px-3 text-[15px] font-medium text-foreground hover:bg-muted",
                      isActive && "bg-accent font-semibold text-accent-foreground hover:bg-accent",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4">
          <ThemeToggle />
          <Button
            variant="outline"
            disabled={logout.isPending}
            onClick={() => {
              logout.mutate();
            }}
          >
            {tr.auth.logout}
          </Button>
        </div>
      </aside>

      <main className="min-w-0 grow-999 basis-140 px-8 py-10">
        <div className="mx-auto flex max-w-275 flex-col gap-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
