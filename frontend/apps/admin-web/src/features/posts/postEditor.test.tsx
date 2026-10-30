import type { Schemas } from "@blog/api-client";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { findEditorIn, typeInEditor } from "@/test/codemirror";
import { problem, signedIn } from "@/test/handlers";
import { media } from "@/test/mediaFixtures";
import { post } from "@/test/postFixtures";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";

const published = post(7, "Kafka'da kaybolan event'ler", {
  status: "PUBLISHED",
  publishedAt: new Date(2026, 9, 14, 9, 12).toISOString(),
  coverMediaId: 3,
  tags: ["Kafka"],
  translations: [
    {
      lang: "tr",
      slug: "kaybolan-eventler",
      title: "Kafka'da kaybolan event'ler",
      summary: "",
      bodyMd: "## Giriş",
      readingMinutes: 6,
    },
  ],
  version: 4,
});

function editorData(saved: Schemas["PostAdminResponse"] = published) {
  return [
    signedIn(),
    http.get("/api/admin/posts/{id}", ({ params, response }) =>
      params.id === String(saved.id)
        ? response(200).json(saved)
        : response.untyped(problem(404, "Post not found")),
    ),
    http.get("/api/admin/media", ({ response }) =>
      response(200).json([media(3, "kafka-kapak.png")]),
    ),
    http.get("/api/admin/tags", ({ response }) =>
      response(200).json([
        { name: "Kafka", slug: "kafka" },
        { name: "Spring Boot", slug: "spring-boot" },
      ]),
    ),
  ];
}

async function openEditor(path: string, heading: string) {
  const result = renderApp(path);
  await screen.findByRole("heading", { name: heading });
  return { ...result, user: userEvent.setup() };
}

function panel() {
  return screen.getByRole("tabpanel");
}

describe("post editor", () => {
  it("shouldFillFormFromSavedPost_whenOpened", async () => {
    server.use(...editorData());

    await openEditor("/posts/7", "Yazıyı düzenle");

    expect(within(panel()).getByLabelText("Başlık")).toHaveValue("Kafka'da kaybolan event'ler");
    expect(within(panel()).getByLabelText("Slug")).toHaveValue("kaybolan-eventler");
    expect(screen.getByRole("radio", { name: /Yayında/ })).toBeChecked();
    expect(
      await screen.findByRole("img", { name: "Seçili kapak: kafka-kapak.png" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Kafka")).toBeInTheDocument();
    expect(screen.getByText(/TR 6 dk/)).toBeInTheDocument();
  });

  it("shouldShowNotFound_whenPostDoesNotExist", async () => {
    server.use(...editorData());

    renderApp("/posts/99");

    expect(await screen.findByRole("heading", { name: "Sayfa bulunamadı" })).toBeInTheDocument();
  });

  it("shouldCreateDraft_withSlugFromTitle_andMoveToItsAddress", async () => {
    let sent: unknown;
    server.use(
      ...editorData(),
      http.post("/api/admin/posts", async ({ request, response }) => {
        sent = await request.json();
        return response(201).json(post(9, "Kafka'da kaybolan event'ler"));
      }),
    );
    const { user, router } = await openEditor("/posts/new", "Yeni yazı");

    await user.type(within(panel()).getByLabelText("Başlık"), "Kafka'da kaybolan event'ler");
    typeInEditor(await findEditorIn(panel()), "## Giriş");
    await user.type(screen.getByLabelText("Etiketler"), "Spring Boot{Enter}");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/posts/9");
    });
    expect(sent).toEqual({
      status: "DRAFT",
      translations: [
        {
          lang: "tr",
          title: "Kafka'da kaybolan event'ler",
          slug: "kafka-da-kaybolan-event-ler",
          bodyMd: "## Giriş",
        },
      ],
      tags: ["Spring Boot"],
    });
    expect(await screen.findByText(/Kaydedildi/)).toBeInTheDocument();
  });

  it("shouldSendChosenMomentWithVersion_whenPostIsScheduled", async () => {
    let sent: Schemas["PostAdminRequest"] | undefined;
    const draft = post(5, "Liquibase", { version: 2 });
    server.use(
      ...editorData(draft),
      http.put("/api/admin/posts/{id}", async ({ request, response }) => {
        sent = await request.json();
        return response(200).json({ ...draft, status: "PUBLISHED", scheduled: true, version: 3 });
      }),
    );
    const { user } = await openEditor("/posts/5", "Yazıyı düzenle");

    await user.click(screen.getByRole("radio", { name: /İleri bir tarihte/ }));
    fireEvent.change(screen.getByLabelText("Yayın tarihi ve saati"), {
      target: { value: "2030-01-15T09:00" },
    });
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(sent).toMatchObject({
        status: "PUBLISHED",
        publishedAt: new Date(2030, 0, 15, 9, 0).toISOString(),
        version: 2,
      });
    });
  });

  it("shouldRefuseToSchedule_whenMomentIsInThePast", async () => {
    server.use(...editorData(post(5, "Liquibase")));
    const { user } = await openEditor("/posts/5", "Yazıyı düzenle");

    await user.click(screen.getByRole("radio", { name: /İleri bir tarihte/ }));
    fireEvent.change(screen.getByLabelText("Yayın tarihi ve saati"), {
      target: { value: "2020-01-15T09:00" },
    });
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByText(/İleri bir tarih seç/)).toBeInTheDocument();
  });

  it("shouldWarnAboutOldAddress_whenSlugOfPublishedPostChanges", async () => {
    server.use(...editorData());
    const { user } = await openEditor("/posts/7", "Yazıyı düzenle");
    const slug = within(panel()).getByLabelText("Slug");

    await user.clear(slug);
    await user.type(slug, "kafka-eventleri");

    expect(slug).toHaveAccessibleDescription(
      expect.stringContaining("/tr/writing/kaybolan-eventler adresi çalışmaz") as string,
    );
  });

  it("shouldMarkSlugInItsLanguage_whenItIsTakenThere", async () => {
    const both = post(7, "Kafka", {
      translations: [
        {
          lang: "tr",
          slug: "kafka",
          title: "Kafka",
          summary: "",
          bodyMd: "Metin",
          readingMinutes: 1,
        },
        {
          lang: "en",
          slug: "kafka",
          title: "Kafka",
          summary: "",
          bodyMd: "Text",
          readingMinutes: 1,
        },
      ],
    });
    server.use(
      ...editorData(both),
      http.put("/api/admin/posts/{id}", ({ response }) =>
        response.untyped(
          problem(
            409,
            "The slug is already used",
            "https://mustafabatmaz.com/problems/slug-taken",
            {
              languages: ["en"],
            },
          ),
        ),
      ),
    );
    const { user } = await openEditor("/posts/7", "Yazıyı düzenle");

    await user.type(within(panel()).getByLabelText("Özet"), "Kısa özet");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    // The form switches to the language whose slug is taken
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /EN/ })).toHaveAttribute("aria-selected", "true");
    });
    expect(within(panel()).getByLabelText("Slug")).toHaveAccessibleDescription(
      expect.stringContaining("bu dilde başka bir yazıda") as string,
    );
    expect(screen.queryByText(/başka bir yerde değişti/)).not.toBeInTheDocument();
  });

  it("shouldDeletePost_andReturnToList_whenDeletionIsConfirmed", async () => {
    let deleted = false;
    server.use(
      ...editorData(),
      http.delete("/api/admin/posts/{id}", ({ response }) => {
        deleted = true;
        return response(204).empty();
      }),
      http.get("/api/admin/posts", ({ response }) =>
        response(200).json({ items: [], page: 1, size: 20, totalItems: 0, totalPages: 0 }),
      ),
    );
    const { user, router } = await openEditor("/posts/7", "Yazıyı düzenle");

    await user.click(screen.getByRole("button", { name: "Sil" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveTextContent("Kafka'da kaybolan event'ler");
    await user.click(within(confirm).getByRole("button", { name: "Sil" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/posts");
    });
    expect(deleted).toBe(true);
  });
});

describe("cover picker", () => {
  function savingTo(
    sink: { body?: Schemas["PostAdminRequest"] },
    saved: Schemas["PostAdminResponse"],
  ) {
    return http.put("/api/admin/posts/{id}", async ({ request, response }) => {
      sink.body = await request.json();
      return response(200).json(saved);
    });
  }

  it("shouldUseChosenImageAsCover_whenItIsPickedAndSaved", async () => {
    const draft = post(5, "Liquibase");
    const sink: { body?: Schemas["PostAdminRequest"] } = {};
    server.use(...editorData(draft), savingTo(sink, draft));
    const { user } = await openEditor("/posts/5", "Yazıyı düzenle");

    await user.click(screen.getByRole("button", { name: "Kapak seç" }));
    const picker = await screen.findByRole("dialog", { name: "Kapak seç" });
    await user.click(
      await within(picker).findByRole("button", { name: "kafka-kapak.png görselini kapak yap" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("img", { name: "Seçili kapak: kafka-kapak.png" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => {
      expect(sink.body?.coverMediaId).toBe(3);
    });
  });

  it("shouldMarkCurrentCover_andNotOfferItAgain", async () => {
    server.use(...editorData());
    const { user } = await openEditor("/posts/7", "Yazıyı düzenle");

    await user.click(screen.getByRole("button", { name: "Değiştir" }));
    const picker = await screen.findByRole("dialog", { name: "Kapak seç" });

    expect(await within(picker).findByText("✓ Şu anki kapak")).toBeInTheDocument();
    expect(
      within(picker).queryByRole("button", { name: "kafka-kapak.png görselini kapak yap" }),
    ).not.toBeInTheDocument();
  });

  it("shouldOfferImageUploadedInPicker_firstInTheList", async () => {
    const stored = [media(3, "kafka-kapak.png")];
    server.use(
      ...editorData(post(5, "Liquibase")),
      http.get("/api/admin/media", ({ response }) => response(200).json(stored)),
      http.post("/api/admin/media", ({ response }) => {
        stored.unshift(media(8, "yeni-kapak.png"));
        return response(201).json(media(8, "yeni-kapak.png"));
      }),
    );
    const { user } = await openEditor("/posts/5", "Yazıyı düzenle");
    await user.click(screen.getByRole("button", { name: "Kapak seç" }));
    const picker = await screen.findByRole("dialog", { name: "Kapak seç" });

    await user.upload(
      within(picker).getByLabelText("Yüklenecek görseller"),
      new File(["png"], "yeni-kapak.png", { type: "image/png" }),
    );

    const choices = await within(picker).findAllByRole("button", { name: /görselini kapak yap/ });
    await waitFor(() => {
      expect(choices[0]).toHaveAccessibleName("yeni-kapak.png görselini kapak yap");
    });
  });

  it("shouldSendNoCover_whenCoverIsRemoved", async () => {
    const sink: { body?: Schemas["PostAdminRequest"] } = {};
    server.use(...editorData(), savingTo(sink, { ...published, coverMediaId: undefined }));
    const { user } = await openEditor("/posts/7", "Yazıyı düzenle");

    await user.click(await screen.findByRole("button", { name: "Kaldır" }));
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(sink.body).toBeDefined();
    });
    expect(sink.body).not.toHaveProperty("coverMediaId");
    expect(screen.getByText("Kapak yok.")).toBeInTheDocument();
  });
});
