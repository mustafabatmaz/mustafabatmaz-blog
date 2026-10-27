import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Monogram } from "@/components/layout/Monogram";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { tr } from "@/i18n/tr";
import { ApiError } from "@/lib/problem";
import { readLoginState } from "./loginState";
import { useLogin } from "./useLogin";
import { useSession } from "./useSession";

const schema = z.object({
  username: z.string().trim().min(1, tr.login.usernameRequired),
  password: z.string().min(1, tr.login.passwordRequired),
});

function loginErrorMessage(error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    return tr.login.invalidCredentials;
  }
  if (error instanceof ApiError && error.status === 429) {
    return tr.login.tooManyAttempts;
  }
  return tr.login.failed;
}

export function LoginPage() {
  // Hooks run on every render, before any early return (rules of hooks)
  const session = useSession();
  const location = useLocation();
  const login = useLogin();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const { from, expired } = readLoginState(location.state);
  if (session.data?.user) {
    return <Navigate to={from} replace />;
  }

  const { errors } = form.formState;
  const message = login.error
    ? loginErrorMessage(login.error)
    : expired && !login.isPending
      ? tr.login.sessionExpired
      : undefined;

  return (
    <div className="flex min-h-svh flex-col px-4 py-6">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center py-10">
        <form
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((values) => {
              login.mutate(values);
            })(event);
          }}
          className="flex w-full max-w-100 flex-col gap-6 rounded-2xl border bg-card px-8 py-10"
        >
          <div className="flex flex-col gap-4">
            <Monogram size="lg" />
            <span className="font-mono text-[13px] text-link">/admin</span>
            <h1 className="text-[32px] leading-tight font-bold tracking-tight">{tr.login.title}</h1>
          </div>

          {message && (
            <p
              role="alert"
              className="rounded-lg bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
            >
              {message}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">{tr.login.username}</Label>
            <Input
              id="username"
              autoComplete="username"
              aria-invalid={errors.username ? true : undefined}
              aria-describedby={errors.username ? "username-error" : undefined}
              {...form.register("username")}
            />
            {errors.username && (
              <p id="username-error" className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{tr.login.password}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...form.register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? tr.login.submitting : tr.login.submit}
          </Button>
          <span className="text-center font-mono text-xs text-muted-foreground">
            {tr.login.sessionHint}
          </span>
        </form>
      </main>
    </div>
  );
}
