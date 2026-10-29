import type { Schemas } from "@blog/api-client";
import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { findEditorIn, typeInEditor } from "@/test/codemirror";
import { problem, signedIn } from "@/test/handlers";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";

const about: Schemas["PageAdminResponse"] = {
  key: "ABOUT",
  translations: [
    { lang: "tr", title: "Hakkımda", bodyMd: "## Merhaba\n\nBackend geliştiriyorum." },
  ],
  version: 2,
  updatedAt: "2026-09-12T07:02:00Z",
};

const now: Schemas["PageAdminResponse"] = {
  key: "NOW",
  translations: [{ lang: "tr", title: "Şu an", bodyMd: "Sitemi yeniden yazıyorum." }],
  version: 5,
  updatedAt: "2026-10-26T18:14:00Z",
};

function pagesExist() {
  return http.get("/api/admin/pages/{key}", ({ params, response }) =>
    response(200).json(params.key === "NOW" ? now : about),
  );
}

// Both languages stay mounted; only the selected tab's panel is visible (and found by role queries)
function languagePanel() {
  return screen.getByRole("tabpanel");
}

async function openPages(path = "/pages") {
  const result = renderApp(path);
  await screen.findByRole("heading", { name: "Sayfalar" });
  // The heading shows while loading; the form (and its tab panel) comes with the data
  await screen.findByRole("tabpanel");
  return { ...result, user: userEvent.setup() };
}

describe("pages", () => {
  it("shouldOpenAboutWithItsMarkdown_whenPagesIsOpened", async () => {
    server.use(signedIn(), pagesExist());

    const { router } = await openPages();

    expect(router.state.location.pathname).toBe("/pages/about");
    expect(await within(languagePanel()).findByLabelText("Başlık")).toHaveValue("Hakkımda");
    expect(
      await within(languagePanel()).findByRole("heading", { name: "Merhaba" }),
    ).toBeInTheDocument();
  });

  it("shouldStartEmpty_whenPageWasNeverSaved", async () => {
    server.use(
      signedIn(),
      http.get("/api/admin/pages/{key}", ({ response }) =>
        response.untyped(problem(404, "Page not found")),
      ),
    );

    await openPages("/pages/now");

    expect(await within(languagePanel()).findByLabelText("Başlık")).toHaveValue("");
    expect(screen.getByText("Henüz kaydedilmedi")).toBeInTheDocument();
  });

  it("shouldSaveTitleAndMarkdown_whenSaved", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      pagesExist(),
      http.put("/api/admin/pages/{key}", async ({ params, request, response }) => {
        sent = { key: params.key, body: await request.json() };
        return response(200).json({ ...about, version: 3 });
      }),
    );
    const { user } = await openPages();
    const editor = await findEditorIn(languagePanel());

    await user.type(within(languagePanel()).getByLabelText("Başlık"), " sayfası");
    typeInEditor(editor, "\n\n- Kafka");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByText(/Kaydedildi/)).toBeInTheDocument();
    expect(sent).toEqual({
      key: "ABOUT",
      body: {
        translations: [
          {
            lang: "tr",
            title: "Hakkımda sayfası",
            bodyMd: "## Merhaba\n\nBackend geliştiriyorum.\n\n- Kafka",
          },
        ],
        version: 2,
      },
    });
  });

  it("shouldRequireBody_whenOnlyTitleIsFilled", async () => {
    server.use(
      signedIn(),
      http.get("/api/admin/pages/{key}", ({ response }) =>
        response.untyped(problem(404, "Page not found")),
      ),
    );
    const { user } = await openPages("/pages/now");

    await user.type(await within(languagePanel()).findByLabelText("Başlık"), "Şu an");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByText("Bu alan gerekli.")).toBeInTheDocument();
  });

  it("shouldLoadOtherPage_whenSwitchingToNow", async () => {
    server.use(signedIn(), pagesExist());
    const { router, user } = await openPages();
    await within(languagePanel()).findByDisplayValue("Hakkımda");

    await user.click(screen.getByRole("link", { name: /Şimdi/ }));

    expect(await within(languagePanel()).findByDisplayValue("Şu an")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/pages/now");
  });

  it("shouldAskBeforeSwitching_whenPageHasUnsavedChanges", async () => {
    server.use(signedIn(), pagesExist());
    const { user } = await openPages();

    await user.type(await within(languagePanel()).findByLabelText("Başlık"), " (taslak)");
    await user.click(screen.getByRole("link", { name: /Şimdi/ }));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Kaydedilmemiş değişiklikler");
  });

  it("shouldShowNotFound_whenPageKeyIsUnknown", async () => {
    server.use(signedIn());

    renderApp("/pages/blog");

    expect(await screen.findByRole("heading", { name: "Sayfa bulunamadı" })).toBeInTheDocument();
  });
});
