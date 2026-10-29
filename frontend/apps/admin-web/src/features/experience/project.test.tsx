import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { findEditorIn, typeInEditor } from "@/test/codemirror";
import { experience, project } from "@/test/experienceFixtures";
import { problem, signedIn } from "@/test/handlers";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";

const withCaseStudy = project(11, 1, "Patent başvuru sistemi", {
  slug: "turkpatent",
  translations: [
    { lang: "tr", name: "Patent başvuru sistemi", client: "TÜRKPATENT", caseStudyMd: "## Sorun" },
  ],
});
const list = [experience(1, "NEG Teknoloji", "2025-06", undefined, [withCaseStudy])];

function backend() {
  return [
    signedIn(),
    http.get("/api/admin/experiences", ({ response }) => response(200).json(list)),
    http.get("/api/admin/technologies", ({ response }) =>
      response(200).json([
        { id: 1, name: "Java 21" },
        { id: 2, name: "Kafka" },
        { id: 3, name: "Kafka Streams" },
      ]),
    ),
  ];
}

// Both languages stay mounted; only the selected tab's panel is visible
function languagePanel() {
  return screen.getByRole("tabpanel");
}

async function openProject(path: string) {
  const result = renderApp(path);
  await screen.findByLabelText("Slug");
  return { ...result, user: userEvent.setup() };
}

describe("project page", () => {
  it("shouldFillForm_whenEditingExistingProject", async () => {
    server.use(...backend());

    await openProject("/experience/projects/11");

    expect(screen.getByRole("heading", { name: "Projeyi düzenle" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /NEG Teknoloji/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toHaveValue("turkpatent");
    expect(within(languagePanel()).getByLabelText("Ad")).toHaveValue("Patent başvuru sistemi");
    expect(
      screen.getByRole("button", { name: "Java 21 teknolojisini kaldır" }),
    ).toBeInTheDocument();
  });

  it("shouldShowNotFound_whenProjectIsUnknown", async () => {
    server.use(...backend());

    renderApp("/experience/projects/99");

    expect(await screen.findByRole("heading", { name: "Sayfa bulunamadı" })).toBeInTheDocument();
  });

  it("shouldGenerateSlugFromTurkishName_whenProjectIsNew", async () => {
    server.use(...backend());
    const { user } = await openProject("/experience/1/projects/new");

    await user.type(within(languagePanel()).getByLabelText("Ad"), "Patent Başvuru Sistemi");

    expect(screen.getByLabelText("Slug")).toHaveValue("patent-basvuru-sistemi");
  });

  it("shouldKeepTypedSlug_whenNameChangesAfterwards", async () => {
    server.use(...backend());
    const { user } = await openProject("/experience/1/projects/new");

    await user.type(screen.getByLabelText("Slug"), "patent");
    await user.type(within(languagePanel()).getByLabelText("Ad"), "Patent Başvuru Sistemi");

    expect(screen.getByLabelText("Slug")).toHaveValue("patent");
  });

  it("shouldCreateProjectAndSwitchToItsAddress_whenSaved", async () => {
    let sent: unknown;
    server.use(
      ...backend(),
      http.post(
        "/api/admin/experiences/{experienceId}/projects",
        async ({ params, request, response }) => {
          sent = { experienceId: params.experienceId, body: await request.json() };
          return response(201).json(project(13, 1, "Marka arama", { slug: "marka-arama" }));
        },
      ),
    );
    const { router, user } = await openProject("/experience/1/projects/new");

    await user.type(within(languagePanel()).getByLabelText("Ad"), "Marka arama");
    await user.type(screen.getByLabelText("Teknolojiler"), "Liquibase{Enter}");
    const highlights = await findEditorIn(
      within(languagePanel()).getByText("Öne çıkanlar").closest("div") ?? languagePanel(),
    );
    typeInEditor(highlights, "- Arama süresini kısalttım");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/experience/projects/13");
    });
    expect(await screen.findByText(/Kaydedildi/)).toBeInTheDocument();
    expect(sent).toEqual({
      experienceId: "1",
      body: {
        slug: "marka-arama",
        translations: [
          { lang: "tr", name: "Marka arama", highlightsMd: "- Arama süresini kısalttım" },
        ],
        technologies: ["Liquibase"],
      },
    });
  });

  it("shouldShowErrorOnSlug_whenSlugIsTaken", async () => {
    server.use(
      ...backend(),
      http.put("/api/admin/projects/{id}", ({ response }) =>
        response.untyped(
          problem(
            409,
            "The slug is already used by another project",
            "https://mustafabatmaz.com/problems/slug-taken",
          ),
        ),
      ),
    );
    const { user } = await openProject("/experience/projects/11");

    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "marka-arama");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByText("Bu slug başka bir projede kullanılıyor.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yeniden yükle" })).not.toBeInTheDocument();
  });

  it("shouldWarnAboutBrokenLink_whenSlugOfCaseStudyChanges", async () => {
    server.use(...backend());
    const { user } = await openProject("/experience/projects/11");

    await user.type(screen.getByLabelText("Slug"), "-yeni");

    expect(screen.getByText(/\/tr\/experience\/turkpatent/)).toBeInTheDocument();
  });

  it("shouldAddKnownSpelling_whenSuggestionIsPicked", async () => {
    server.use(...backend());
    const { user } = await openProject("/experience/projects/11");

    await user.type(screen.getByLabelText("Teknolojiler"), "kaf");
    await user.click(await screen.findByRole("option", { name: "Kafka" }));

    expect(screen.getByRole("button", { name: "Kafka teknolojisini kaldır" })).toBeInTheDocument();
    expect(screen.getByLabelText("Teknolojiler")).toHaveValue("");
  });

  it("shouldRemoveLastTechnology_whenBackspaceIsPressedInEmptyInput", async () => {
    server.use(...backend());
    const { user } = await openProject("/experience/projects/11");

    await user.click(screen.getByLabelText("Teknolojiler"));
    await user.keyboard("{Backspace}");

    expect(
      screen.queryByRole("button", { name: "Java 21 teknolojisini kaldır" }),
    ).not.toBeInTheDocument();
  });
});
