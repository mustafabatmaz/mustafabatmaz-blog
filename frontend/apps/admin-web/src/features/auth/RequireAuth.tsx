import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import type { LoginState } from "./loginState";
import { useSession } from "./useSession";

// Layout route that guards every admin page (the CanActivate guard of this app)
export function RequireAuth() {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) {
    return (
      <p role="status" className="p-8 text-muted-foreground">
        {tr.common.loading}
      </p>
    );
  }
  if (session.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4 p-8">
        <p>{tr.auth.sessionCheckFailed}</p>
        <Button variant="outline" onClick={() => void session.refetch()}>
          {tr.common.retry}
        </Button>
      </div>
    );
  }
  if (!session.data.user) {
    const state: LoginState = {
      from: location.pathname + location.search,
      expired: session.data.expired,
    };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}
