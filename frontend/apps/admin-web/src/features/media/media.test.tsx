import type { Schemas } from "@blog/api-client";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { problem, signedIn } from "@/test/handlers";
import { media, png } from "@/test/mediaFixtures";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";
import { MAX_FILE_SIZE } from "./mediaFiles";

type Media = Schemas["MediaAdminResponse"];

const list: Media[] = [
  media(1, "kafka-consumer-lag.png", {
    translations: [
      { lang: "tr", altText: "Consumer lag grafiği" },
      { lang: "en", altText: "Consumer lag chart" },
    ],
  }),
  media(2, "istanbul-meetup.avif", {
    format: "AVIF",
    sizeBytes: 1.8 * 1024 * 1024,
    metadataStripped: false,
  }),
  media(3, "postgres-explain.png"),
];

function mediaExist(items = list) {
  return http.get("/api/admin/media", ({ response }) => response(200).json(items));
}

async function openMedia() {
  const result = renderApp("/media");
  await screen.findByRole("heading", { name: "Medya" });
  // applyAccept: false lets a test pick files the accept attribute would hide, as "All files" does in the dialog
  return { ...result, user: userEvent.setup({ applyAccept: false }) };
}

function cards() {
  return within(screen.getByRole("list", { name: "Görseller" })).getAllByRole("listitem");
}

function uploadRow(name: string) {
  const uploads = screen.getByRole("region", { name: "Yüklemeler" });
  const row = within(uploads)
    .getAllByRole("listitem")
    .find((li) => li.textContent.includes(name));
  if (!row) {
    throw new Error(`No upload row for ${name}`);
  }
  return row;
}

describe("media", () => {
  it("shouldListImagesWithAltTextAndMetadataStatus_whenOpened", async () => {
    server.use(signedIn(), mediaExist());

    await openMedia();

    expect(await screen.findByText("3 görsel · 2 tanesinde alt metin yok")).toBeInTheDocument();
    const [kafka, avif, postgres] = cards();
    expect(kafka).toHaveTextContent("PNG · 284 KB");
    expect(kafka).toHaveTextContent("Alt metin · TR EN");
    expect(avif).toHaveTextContent("AVIF · 1,8 MB");
    expect(avif).toHaveTextContent("Metadata temizlenmedi");
    expect(postgres).toHaveTextContent("Alt metin yok");
    expect(postgres).not.toHaveTextContent("Metadata temizlenmedi");
  });

  it("shouldShowEmptyState_whenThereAreNoImages", async () => {
    server.use(signedIn(), mediaExist([]));

    await openMedia();

    expect(await screen.findByText(/Henüz görsel yok/)).toBeInTheDocument();
  });

  it("shouldShowOnlyImagesWithoutAltText_whenFilterIsChosen", async () => {
    server.use(signedIn(), mediaExist());
    const { user } = await openMedia();

    await user.click(await screen.findByRole("button", { name: "Alt metni eksik (2)" }));

    expect(cards().map((card) => card.textContent)).toEqual([
      expect.stringContaining("istanbul-meetup.avif"),
      expect.stringContaining("postgres-explain.png"),
    ]);
    expect(screen.getByRole("button", { name: "Alt metni eksik (2)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shouldSendChosenFile_andShowItFirstInList", async () => {
    let sent: { name: string; size: number } | undefined;
    server.use(
      signedIn(),
      mediaExist(),
      http.post("/api/admin/media", async ({ request, response }) => {
        const file = (await request.formData()).get("file");
        if (file instanceof File) {
          sent = { name: file.name, size: file.size };
        }
        return response(201).json(media(4, "mimari-akis.png", { sizeBytes: 340 * 1024 }));
      }),
    );
    const { user } = await openMedia();

    await user.upload(screen.getByLabelText("Yüklenecek görseller"), png("mimari-akis.png", 2048));

    await waitFor(() => {
      expect(uploadRow("mimari-akis.png")).toHaveTextContent("✓ Yüklendi");
    });
    expect(uploadRow("mimari-akis.png")).toHaveTextContent("konum ve kamera bilgisi silindi");
    expect(sent).toEqual({ name: "mimari-akis.png", size: 2048 });
    expect(cards()[0]).toHaveTextContent("mimari-akis.png");
  });

  it("shouldUploadDroppedFiles_whenTheyAreDroppedOnTheZone", async () => {
    server.use(
      signedIn(),
      mediaExist(),
      http.post("/api/admin/media", ({ response }) => response(201).json(media(4, "drop.png"))),
    );
    await openMedia();

    fireEvent.drop(screen.getByText(/Görselleri buraya sürükle/), {
      dataTransfer: { files: [png("drop.png")], types: ["Files"] },
    });

    await waitFor(() => {
      expect(uploadRow("drop.png")).toHaveTextContent("✓ Yüklendi");
    });
  });

  it("shouldUploadFilesOneAtATime_inTheOrderTheyWereChosen", async () => {
    const order: string[] = [];
    let running = 0;
    let mostAtOnce = 0;
    server.use(
      signedIn(),
      mediaExist(),
      http.post("/api/admin/media", async ({ request, response }) => {
        running += 1;
        mostAtOnce = Math.max(mostAtOnce, running);
        const file = (await request.formData()).get("file");
        const name = file instanceof File ? file.name : "?";
        order.push(name);
        await new Promise((resolve) => setTimeout(resolve, 20));
        running -= 1;
        return response(201).json(media(order.length + 10, name));
      }),
    );
    const { user } = await openMedia();

    await user.upload(screen.getByLabelText("Yüklenecek görseller"), [
      png("bir.png"),
      png("iki.png"),
      png("uc.png"),
    ]);

    await waitFor(() => {
      expect(uploadRow("uc.png")).toHaveTextContent("✓ Yüklendi");
    });
    expect(order).toEqual(["bir.png", "iki.png", "uc.png"]);
    expect(mostAtOnce).toBe(1);
  });

  it("shouldNotSendFile_whenBrowserAlreadyKnowsItWontBeAccepted", async () => {
    // No POST handler: a request would fail the test as unhandled
    server.use(signedIn(), mediaExist());
    const { user } = await openMedia();

    await user.upload(screen.getByLabelText("Yüklenecek görseller"), [
      new File(["heic"], "IMG_2041.HEIC", { type: "image/heic" }),
      png("panorama.png", MAX_FILE_SIZE + 1),
    ]);

    expect(uploadRow("IMG_2041.HEIC")).toHaveTextContent("Bu dosya türü desteklenmiyor");
    expect(uploadRow("panorama.png")).toHaveTextContent("5 MB");
    expect(uploadRow("panorama.png")).toHaveTextContent("En fazla 5 MB olabilir");
  });

  it("shouldExplainRejection_whenBackendRejectsFileContent", async () => {
    server.use(
      signedIn(),
      mediaExist(),
      http.post("/api/admin/media", ({ response }) =>
        response.untyped(problem(415, "Only JPEG, PNG, WebP and AVIF images are accepted")),
      ),
    );
    const { user } = await openMedia();

    // Named .png, but the backend decides from the bytes
    await user.upload(screen.getByLabelText("Yüklenecek görseller"), png("sahte.png"));

    await waitFor(() => {
      expect(uploadRow("sahte.png")).toHaveTextContent("Bu dosya türü desteklenmiyor");
    });
    expect(uploadRow("sahte.png")).toHaveTextContent("Yüklenmedi");
  });

  it("shouldWarnAboutMetadata_whenUploadedImageCouldNotBeCleaned", async () => {
    server.use(
      signedIn(),
      mediaExist(),
      http.post("/api/admin/media", ({ response }) =>
        response(201).json(media(4, "foto.avif", { format: "AVIF", metadataStripped: false })),
      ),
    );
    const { user } = await openMedia();

    await user.upload(
      screen.getByLabelText("Yüklenecek görseller"),
      new File(["avif"], "foto.avif", { type: "image/avif" }),
    );

    await waitFor(() => {
      expect(uploadRow("foto.avif")).toHaveTextContent("metadata temizlenmedi");
    });
  });

  it("shouldRemoveUploadRow_whenItIsDismissed", async () => {
    server.use(signedIn(), mediaExist());
    const { user } = await openMedia();
    await user.upload(
      screen.getByLabelText("Yüklenecek görseller"),
      new File(["svg"], "logo.svg", { type: "image/svg+xml" }),
    );

    await user.click(screen.getByRole("button", { name: "logo.svg satırını kaldır" }));

    expect(screen.queryByRole("region", { name: "Yüklemeler" })).not.toBeInTheDocument();
  });
});

describe("media editor", () => {
  async function openEditor(name: string) {
    const opened = await openMedia();
    await opened.user.click(
      await screen.findByRole("button", { name: `${name} görselini düzenle` }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Görseli düzenle" });
    return { ...opened, dialog };
  }

  function altTextIn(dialog: HTMLElement) {
    return within(within(dialog).getByRole("tabpanel")).getByLabelText("Alt metin");
  }

  it("shouldSaveAltTextWithLoadedVersion_whenEditorIsSaved", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      mediaExist(),
      http.put("/api/admin/media/{id}", async ({ request, response }) => {
        sent = await request.json();
        return response(200).json(
          media(3, "postgres-explain.png", {
            translations: [{ lang: "tr", altText: "EXPLAIN çıktısı" }],
            version: 1,
          }),
        );
      }),
    );
    const { user, dialog } = await openEditor("postgres-explain.png");

    await user.type(altTextIn(dialog), "EXPLAIN çıktısı");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(sent).toEqual({
      translations: [{ lang: "tr", altText: "EXPLAIN çıktısı" }],
      version: 0,
    });
    expect(cards()[2]).toHaveTextContent("Alt metin · TR");
  });

  it("shouldOpenEditor_whenAltTextIsAddedRightAfterUpload", async () => {
    // Like the real backend, the list includes the upload from then on (focus can trigger a refetch)
    const stored = [...list];
    server.use(
      signedIn(),
      http.get("/api/admin/media", ({ response }) => response(200).json(stored)),
      http.post("/api/admin/media", ({ response }) => {
        stored.unshift(media(4, "mimari-akis.png"));
        return response(201).json(media(4, "mimari-akis.png"));
      }),
    );
    const { user } = await openMedia();
    await user.upload(screen.getByLabelText("Yüklenecek görseller"), png("mimari-akis.png"));

    await user.click(
      await screen.findByRole("button", { name: "mimari-akis.png için alt metin ekle" }),
    );

    const dialog = await screen.findByRole("dialog", { name: "Görseli düzenle" });
    expect(dialog).toHaveTextContent("mimari-akis.png");
  });

  it("shouldExplainMetadataRisk_whenImageWasNotCleaned", async () => {
    server.use(signedIn(), mediaExist());

    const { dialog } = await openEditor("istanbul-meetup.avif");

    expect(dialog).toHaveTextContent("AVIF dosyalarından konum ve kamera bilgisi silinemiyor");
  });

  it("shouldDeleteImage_whenDeletionIsConfirmed", async () => {
    let deleted: string | undefined;
    server.use(
      signedIn(),
      mediaExist(),
      http.delete("/api/admin/media/{id}", ({ params, response }) => {
        deleted = params.id;
        return response(204).empty();
      }),
    );
    const { user, dialog } = await openEditor("postgres-explain.png");

    await user.click(within(dialog).getByRole("button", { name: "Görseli sil" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveTextContent('"postgres-explain.png" silinsin mi?');
    await user.click(within(confirm).getByRole("button", { name: "Sil" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(deleted).toBe("3");
    expect(cards()).toHaveLength(2);
  });

  it("shouldExplainImageIsInUse_whenDeletionIsRejected", async () => {
    server.use(
      signedIn(),
      mediaExist(),
      http.delete("/api/admin/media/{id}", ({ response }) =>
        response.untyped(
          problem(
            409,
            "The image is in use and can't be deleted",
            "https://mustafabatmaz.com/problems/media-in-use",
          ),
        ),
      ),
    );
    const { user, dialog } = await openEditor("postgres-explain.png");

    await user.click(within(dialog).getByRole("button", { name: "Görseli sil" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Sil" }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "bir yazının kapağı olarak kullanılıyor",
    );
    expect(screen.getByRole("dialog", { name: "Görseli düzenle" })).toBeInTheDocument();
    // The open dialog hides the page from the accessibility tree, hence hidden: true
    const gallery = screen.getByRole("list", { name: "Görseller", hidden: true });
    expect(within(gallery).getAllByRole("listitem", { hidden: true })).toHaveLength(3);
  });

  it("shouldLoadCurrentAltText_whenSavingConflictsAndUserReloads", async () => {
    let listed = 0;
    server.use(
      signedIn(),
      http.get("/api/admin/media", ({ response }) => {
        listed += 1;
        return response(200).json(
          listed === 1
            ? list
            : list.map((item) =>
                item.id === 3
                  ? {
                      ...item,
                      translations: [{ lang: "tr" as const, altText: "Başka sekmede" }],
                      version: 1,
                    }
                  : item,
              ),
        );
      }),
      http.put("/api/admin/media/{id}", ({ response }) =>
        response.untyped(
          problem(409, "Changed elsewhere", "https://mustafabatmaz.com/problems/version-conflict"),
        ),
      ),
    );
    const { user, dialog } = await openEditor("postgres-explain.png");
    await user.type(altTextIn(dialog), "Benim metnim");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await user.click(await within(dialog).findByRole("button", { name: "Yeniden yükle" }));

    await waitFor(() => {
      expect(altTextIn(dialog)).toHaveValue("Başka sekmede");
    });
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });
});
