import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { api, unwrap } from "@/lib/api";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";

function problem(status: number, detail: string) {
  return HttpResponse.json(
    { type: "about:blank", status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

function signedIn() {
  return http.get("/api/admin/auth/me", ({ response }) =>
    response(200).json({ username: "mustafa" }),
  );
}

function signedOut() {
  return http.get("/api/admin/auth/me", ({ response }) =>
    response.untyped(problem(401, "Authentication required")),
  );
}

async function fillAndSubmit(username: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Kullanıcı adı"), username);
  await user.type(screen.getByLabelText("Şifre"), password);
  await user.click(screen.getByRole("button", { name: "Giriş yap" }));
}

describe("session", () => {
  it("shouldRedirectToLogin_whenThereIsNoSession", async () => {
    server.use(signedOut());

    const { router } = renderApp("/posts");

    expect(await screen.findByRole("heading", { name: "Giriş yap" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("shouldShowPanel_whenSessionExists", async () => {
    server.use(signedIn());

    renderApp("/posts");

    expect(await screen.findByRole("heading", { name: "Yazılar" })).toBeInTheDocument();
  });

  it("shouldShowSessionExpiredMessage_whenApiRejectsRequestDuringSession", async () => {
    server.use(
      signedIn(),
      http.get("/api/admin/tags", ({ response }) =>
        response.untyped(problem(401, "Authentication required")),
      ),
    );
    const { queryClient, router } = renderApp("/posts");
    await screen.findByRole("heading", { name: "Yazılar" });

    await queryClient
      .query({ queryKey: ["tags"], queryFn: () => unwrap(api.GET("/api/admin/tags")) })
      .catch(() => undefined);

    expect(await screen.findByRole("alert")).toHaveTextContent("Oturumun süresi doldu");
    expect(router.state.location.pathname).toBe("/login");
  });

  it("shouldOpenSection_whenMenuItemIsClicked", async () => {
    server.use(signedIn());
    const { router } = renderApp("/posts");

    await userEvent.setup().click(await screen.findByRole("link", { name: "Medya" }));

    expect(await screen.findByRole("heading", { name: "Medya" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/media");
  });

  it("shouldReturnToLogin_whenUserLogsOut", async () => {
    server.use(
      signedIn(),
      http.post("/api/admin/auth/logout", ({ response }) => response(204).empty()),
    );
    renderApp("/posts");

    await userEvent.setup().click(await screen.findByRole("button", { name: "Çıkış yap" }));

    expect(await screen.findByRole("heading", { name: "Giriş yap" })).toBeInTheDocument();
  });
});

describe("login", () => {
  it("shouldShowRequiredErrors_whenFieldsAreEmpty", async () => {
    server.use(signedOut());
    renderApp("/login");

    await userEvent.setup().click(await screen.findByRole("button", { name: "Giriş yap" }));

    expect(await screen.findByText("Kullanıcı adı gerekli.")).toBeInTheDocument();
    expect(screen.getByText("Şifre gerekli.")).toBeInTheDocument();
  });

  it("shouldShowInvalidCredentials_whenServerRejectsLogin", async () => {
    server.use(
      signedOut(),
      http.post("/api/admin/auth/login", ({ response }) =>
        response.untyped(problem(401, "Invalid credentials")),
      ),
    );
    renderApp("/login");

    await fillAndSubmit("mustafa", "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("Kullanıcı adı veya şifre hatalı.");
  });

  it("shouldShowRateLimitMessage_whenThereAreTooManyAttempts", async () => {
    server.use(
      signedOut(),
      http.post("/api/admin/auth/login", ({ response }) =>
        response.untyped(problem(429, "Too many login attempts")),
      ),
    );
    renderApp("/login");

    await fillAndSubmit("mustafa", "any-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("Çok fazla deneme");
  });

  it("shouldReturnToRequestedPage_whenLoginSucceeds", async () => {
    let loggedIn = false;
    let sentBody: unknown;
    let sentCsrf: string | null = null;
    document.cookie = "XSRF-TOKEN=token-1";
    server.use(
      http.get("/api/admin/auth/me", ({ response }) =>
        loggedIn
          ? response(200).json({ username: "mustafa" })
          : response.untyped(problem(401, "Authentication required")),
      ),
      http.post("/api/admin/auth/login", async ({ request, response }) => {
        sentBody = await request.json();
        sentCsrf = request.headers.get("X-XSRF-TOKEN");
        loggedIn = true;
        return response(204).empty();
      }),
    );
    const { router } = renderApp("/posts");

    await fillAndSubmit("mustafa", "correct-password");

    expect(await screen.findByRole("heading", { name: "Yazılar" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/posts");
    expect(sentBody).toEqual({ username: "mustafa", password: "correct-password" });
    expect(sentCsrf).toBe("token-1");
  });
});
