import type { Schemas } from "@blog/api-client";
import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { problem, signedIn } from "@/test/handlers";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";

type Item = Schemas["UsesItemAdminResponse"];

function item(id: number, category: Item["category"], name: string, sortOrder: number): Item {
  return {
    id,
    category,
    sortOrder,
    url: "",
    translations: [{ lang: "tr", name, description: `${name} açıklaması` }],
    version: 0,
    updatedAt: "2026-10-27T10:00:00Z",
  };
}

const list: Item[] = [
  item(1, "DEV_TOOLS", "IntelliJ IDEA", 1),
  item(2, "HARDWARE", "MacBook Pro", 2),
  item(3, "DEV_TOOLS", "WebStorm", 3),
];

function usesExist(items = list) {
  return http.get("/api/admin/uses", ({ response }) => response(200).json(items));
}

async function openUses() {
  const result = renderApp("/uses");
  await screen.findByRole("heading", { name: "Kullandıklarım" });
  return { ...result, user: userEvent.setup() };
}

describe("uses", () => {
  it("shouldListItemsByCategory_whenOpened", async () => {
    server.use(signedIn(), usesExist());

    await openUses();

    const devTools = await screen.findByRole("region", { name: "Geliştirme araçları" });
    expect(
      within(devTools)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([expect.stringContaining("IntelliJ IDEA"), expect.stringContaining("WebStorm")]);
    expect(screen.getByRole("region", { name: "Donanım" })).toHaveTextContent("MacBook Pro");
  });

  it("shouldShowEmptyState_whenThereAreNoItems", async () => {
    server.use(signedIn(), usesExist([]));

    await openUses();

    expect(await screen.findByText(/Henüz öğe yok/)).toBeInTheDocument();
  });

  it("shouldCreateItem_whenNewItemIsSaved", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      usesExist(),
      http.post("/api/admin/uses", async ({ request, response }) => {
        sent = await request.json();
        return response(201).json(item(4, "SOFTWARE", "Obsidian", 4));
      }),
    );
    const { user } = await openUses();

    await user.click(await screen.findByRole("button", { name: "Yeni öğe" }));
    const dialog = await screen.findByRole("dialog", { name: "Yeni öğe" });
    await user.selectOptions(within(dialog).getByLabelText("Kategori"), "SOFTWARE");
    await user.type(within(within(dialog).getByRole("tabpanel")).getByLabelText("Ad"), "Obsidian");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByRole("region", { name: "Yazılım" })).toHaveTextContent("Obsidian");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sent).toEqual({
      category: "SOFTWARE",
      translations: [{ lang: "tr", name: "Obsidian" }],
    });
  });

  it("shouldSendVersion_whenExistingItemIsEdited", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      usesExist(),
      http.put("/api/admin/uses/{id}", async ({ params, request, response }) => {
        sent = { id: params.id, body: await request.json() };
        return response(200).json({ ...item(3, "DEV_TOOLS", "WebStorm 2026", 3), version: 1 });
      }),
    );
    const { user } = await openUses();

    await user.click(await screen.findByRole("button", { name: "WebStorm öğesini düzenle" }));
    const dialog = await screen.findByRole("dialog", { name: "Öğeyi düzenle" });
    await user.type(within(within(dialog).getByRole("tabpanel")).getByLabelText("Ad"), " 2026");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByText("WebStorm 2026")).toBeInTheDocument();
    expect(sent).toEqual({
      id: "3",
      body: {
        category: "DEV_TOOLS",
        translations: [{ lang: "tr", name: "WebStorm 2026", description: "WebStorm açıklaması" }],
        version: 0,
      },
    });
  });

  it("shouldRequireName_whenSavingNewItem", async () => {
    server.use(signedIn(), usesExist());
    const { user } = await openUses();

    await user.click(await screen.findByRole("button", { name: "Yeni öğe" }));
    const dialog = await screen.findByRole("dialog", { name: "Yeni öğe" });
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    expect(await within(dialog).findByText("En az bir dilde içerik gir.")).toBeInTheDocument();
  });

  it("shouldAskBeforeClosing_whenDialogHasChanges", async () => {
    server.use(signedIn(), usesExist());
    const { user } = await openUses();
    await user.click(await screen.findByRole("button", { name: "Yeni öğe" }));
    const dialog = await screen.findByRole("dialog", { name: "Yeni öğe" });
    await user.type(within(within(dialog).getByRole("tabpanel")).getByLabelText("Ad"), "Raycast");

    await user.click(within(dialog).getByRole("button", { name: "Vazgeç" }));
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Düzenlemeye dön" }));

    expect(screen.getByRole("dialog", { name: "Yeni öğe" })).toBeInTheDocument();
    expect(within(within(dialog).getByRole("tabpanel")).getByLabelText("Ad")).toHaveValue(
      "Raycast",
    );
  });

  it("shouldDeleteItem_whenUserConfirms", async () => {
    let deleted: string | undefined;
    server.use(
      signedIn(),
      usesExist(),
      http.delete("/api/admin/uses/{id}", ({ params, response }) => {
        deleted = params.id;
        return response(204).empty();
      }),
    );
    const { user } = await openUses();

    await user.click(await screen.findByRole("button", { name: "MacBook Pro öğesini sil" }));
    const confirm = await screen.findByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Sil" }));

    await waitFor(() => {
      expect(screen.queryByText("MacBook Pro")).not.toBeInTheDocument();
    });
    expect(deleted).toBe("2");
  });

  it("shouldSendWholeOrder_whenItemMovesUpWithinCategory", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      usesExist(),
      http.put("/api/admin/uses/order", async ({ request, response }) => {
        sent = await request.json();
        return response(200).json([
          { ...list[2], sortOrder: 1 },
          { ...list[1], sortOrder: 2 },
          { ...list[0], sortOrder: 3 },
        ]);
      }),
    );
    const { user } = await openUses();

    await user.click(await screen.findByRole("button", { name: "WebStorm öğesini yukarı taşı" }));

    expect(sent).toEqual({ ids: [3, 2, 1] });
    const devTools = screen.getByRole("region", { name: "Geliştirme araçları" });
    await waitFor(() => {
      expect(within(devTools).getAllByRole("listitem")[0]).toHaveTextContent("WebStorm");
    });
    expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
      "WebStorm 1. sıraya taşındı",
    );
  });

  it("shouldReloadList_whenReorderIsRejected", async () => {
    let loads = 0;
    server.use(
      signedIn(),
      http.get("/api/admin/uses", ({ response }) => {
        loads += 1;
        return response(200).json(list);
      }),
      http.put("/api/admin/uses/order", ({ response }) =>
        response.untyped(problem(400, "The order must list every item exactly once")),
      ),
    );
    const { user } = await openUses();

    await user.click(await screen.findByRole("button", { name: "WebStorm öğesini yukarı taşı" }));

    await waitFor(() => {
      expect(loads).toBe(2);
    });
  });
});
