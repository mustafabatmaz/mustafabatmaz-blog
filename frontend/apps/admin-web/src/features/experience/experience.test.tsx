import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { experience, project } from "@/test/experienceFixtures";
import { signedIn } from "@/test/handlers";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";

const list = [
  experience(1, "NEG Teknoloji", "2025-06", undefined, [
    project(11, 1, "Patent başvuru sistemi"),
    project(12, 1, "Marka arama"),
  ]),
  experience(2, "Grey&Rea Technology", "2020-02", "2025-05"),
];

function experiencesExist(items = list) {
  return http.get("/api/admin/experiences", ({ response }) => response(200).json(items));
}

async function openExperience() {
  const result = renderApp("/experience");
  await screen.findByRole("heading", { name: "Deneyim" });
  return { ...result, user: userEvent.setup() };
}

async function fillMonth(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  which: "Başlangıç" | "Bitiş",
  month: string,
  year: string,
) {
  await user.selectOptions(within(dialog).getByLabelText(`${which} ayı`), month);
  await user.selectOptions(within(dialog).getByLabelText(`${which} yılı`), year);
}

describe("experience", () => {
  it("shouldListCompaniesWithTheirProjects_whenOpened", async () => {
    server.use(signedIn(), experiencesExist());

    await openExperience();

    const neg = await screen.findByRole("region", { name: "NEG Teknoloji" });
    expect(neg).toHaveTextContent("Haz 2025 — Halen");
    expect(
      within(neg)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      expect.stringContaining("Patent başvuru sistemi"),
      expect.stringContaining("Marka arama"),
    ]);
    expect(screen.getByRole("region", { name: "Grey&Rea Technology" })).toHaveTextContent(
      "Şub 2020 — May 2025",
    );
  });

  it("shouldShowEmptyState_whenThereIsNoExperience", async () => {
    server.use(signedIn(), experiencesExist([]));

    await openExperience();

    expect(await screen.findByText(/Henüz deneyim yok/)).toBeInTheDocument();
  });

  it("shouldCreateCurrentRole_whenStillWorkingThere", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      experiencesExist([]),
      http.post("/api/admin/experiences", async ({ request, response }) => {
        sent = await request.json();
        return response(201).json(experience(3, "NEG Teknoloji", "2025-06", undefined));
      }),
    );
    const { user } = await openExperience();

    await user.click(await screen.findByRole("button", { name: "Yeni deneyim" }));
    const dialog = await screen.findByRole("dialog", { name: "Yeni deneyim" });
    await user.type(within(dialog).getByLabelText("Şirket"), "NEG Teknoloji");
    await fillMonth(user, dialog, "Başlangıç", "06", "2025");
    await user.click(within(dialog).getByLabelText("Halen burada çalışıyorum"));
    await user.type(
      within(within(dialog).getByRole("tabpanel")).getByLabelText("Rol"),
      "Senior Software Developer",
    );
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByRole("region", { name: "NEG Teknoloji" })).toBeInTheDocument();
    expect(sent).toEqual({
      company: "NEG Teknoloji",
      startMonth: "2025-06",
      translations: [{ lang: "tr", roleTitle: "Senior Software Developer" }],
    });
  });

  it("shouldRejectEndBeforeStart_whenDatesAreReversed", async () => {
    server.use(signedIn(), experiencesExist([]));
    const { user } = await openExperience();

    await user.click(await screen.findByRole("button", { name: "Yeni deneyim" }));
    const dialog = await screen.findByRole("dialog", { name: "Yeni deneyim" });
    await user.type(within(dialog).getByLabelText("Şirket"), "Biletix");
    await fillMonth(user, dialog, "Başlangıç", "06", "2025");
    await fillMonth(user, dialog, "Bitiş", "01", "2024");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(await within(dialog).findByText("Bitiş, başlangıçtan önce olamaz.")).toBeInTheDocument();
  });

  it("shouldSendEndMonthAndVersion_whenRoleIsFinished", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      experiencesExist(),
      http.put("/api/admin/experiences/{id}", async ({ params, request, response }) => {
        sent = { id: params.id, body: await request.json() };
        return response(200).json({ ...list[0], endMonth: "2026-09", version: 1 });
      }),
    );
    const { user } = await openExperience();

    await user.click(
      await screen.findByRole("button", { name: "NEG Teknoloji deneyimini düzenle" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Deneyimi düzenle" });
    await user.click(within(dialog).getByLabelText("Halen burada çalışıyorum"));
    await fillMonth(user, dialog, "Bitiş", "09", "2026");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(sent).toEqual({
      id: "1",
      body: {
        company: "NEG Teknoloji",
        startMonth: "2025-06",
        endMonth: "2026-09",
        translations: [{ lang: "tr", roleTitle: "Senior Software Developer" }],
        version: 0,
      },
    });
  });

  it("shouldMentionProjectCount_whenDeletingCompany", async () => {
    let deleted: string | undefined;
    server.use(
      signedIn(),
      experiencesExist(),
      http.delete("/api/admin/experiences/{id}", ({ params, response }) => {
        deleted = params.id;
        return response(204).empty();
      }),
    );
    const { user } = await openExperience();

    await user.click(await screen.findByRole("button", { name: "NEG Teknoloji deneyimini sil" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveTextContent("NEG Teknoloji ve 2 projesi silinsin mi?");
    await user.click(within(confirm).getByRole("button", { name: "Sil" }));

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: "NEG Teknoloji" })).not.toBeInTheDocument();
    });
    expect(deleted).toBe("1");
  });

  it("shouldSendCompanyProjectOrder_whenProjectMovesDown", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      experiencesExist(),
      http.put(
        "/api/admin/experiences/{experienceId}/projects/order",
        async ({ params, request, response }) => {
          sent = { experienceId: params.experienceId, body: await request.json() };
          return response(200).json([
            project(12, 1, "Marka arama", { sortOrder: 1 }),
            project(11, 1, "Patent başvuru sistemi", { sortOrder: 2 }),
          ]);
        },
      ),
    );
    const { user } = await openExperience();

    await user.click(
      await screen.findByRole("button", { name: "Patent başvuru sistemi projesini aşağı taşı" }),
    );

    expect(sent).toEqual({ experienceId: "1", body: { ids: [12, 11] } });
    const neg = screen.getByRole("region", { name: "NEG Teknoloji" });
    await waitFor(() => {
      expect(within(neg).getAllByRole("listitem")[0]).toHaveTextContent("Marka arama");
    });
  });

  it("shouldDeleteProject_whenUserConfirms", async () => {
    server.use(
      signedIn(),
      experiencesExist(),
      http.delete("/api/admin/projects/{id}", ({ response }) => response(204).empty()),
    );
    const { user } = await openExperience();

    await user.click(await screen.findByRole("button", { name: "Marka arama projesini sil" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Sil" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Marka arama")).not.toBeInTheDocument();
    });
  });
});
