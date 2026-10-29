import type { Schemas } from "@blog/api-client";
import { screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { problem, signedIn } from "@/test/handlers";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";

const saved: Schemas["ProfileAdminResponse"] = {
  fullName: "Mustafa Batmaz",
  email: "hello@example.com",
  location: "Ankara, Türkiye",
  translations: [{ lang: "tr", headline: "Senior Software Developer", intro: "Java ve Spring." }],
  socialLinks: [
    { platform: "LINKEDIN", url: "https://www.linkedin.com/in/example" },
    { platform: "GITHUB", url: "https://github.com/example" },
    { platform: "MEDIUM", url: "https://medium.com/@example" },
  ],
  version: 3,
  updatedAt: "2026-10-27T10:00:00Z",
};

function profileExists(profile = saved) {
  return http.get("/api/admin/profile", ({ response }) => response(200).json(profile));
}

// Both languages stay mounted; only the selected tab's panel is visible (and found by role queries)
function inLanguagePanel() {
  return within(screen.getByRole("tabpanel"));
}

async function openProfile() {
  const result = renderApp("/profile");
  await screen.findByRole("heading", { name: "Profil" });
  return { ...result, user: userEvent.setup() };
}

describe("profile", () => {
  it("shouldFillForm_whenProfileExists", async () => {
    server.use(signedIn(), profileExists());

    await openProfile();

    expect(await screen.findByLabelText("Ad soyad")).toHaveValue("Mustafa Batmaz");
    expect(inLanguagePanel().getByLabelText("Unvan")).toHaveValue("Senior Software Developer");
    expect(screen.getAllByRole("combobox", { name: "Platform" })).toHaveLength(3);
  });

  it("shouldStartWithEmptyForm_whenProfileWasNeverSaved", async () => {
    server.use(
      signedIn(),
      http.get("/api/admin/profile", ({ response }) =>
        response.untyped(problem(404, "Profile not found")),
      ),
    );

    await openProfile();

    expect(await screen.findByLabelText("Ad soyad")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shouldSendWholeProfileWithVersion_whenSaved", async () => {
    let sent: unknown;
    server.use(
      signedIn(),
      profileExists(),
      http.put("/api/admin/profile", async ({ request, response }) => {
        sent = await request.json();
        return response(200).json({ ...saved, fullName: "Mustafa B.", version: 4 });
      }),
    );
    const { user } = await openProfile();
    const fullName = await screen.findByLabelText("Ad soyad");

    await user.clear(fullName);
    await user.type(fullName, "Mustafa B.");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByText(/Kaydedildi/)).toBeInTheDocument();
    expect(sent).toEqual({
      fullName: "Mustafa B.",
      email: "hello@example.com",
      location: "Ankara, Türkiye",
      translations: [
        { lang: "tr", headline: "Senior Software Developer", intro: "Java ve Spring." },
      ],
      socialLinks: saved.socialLinks,
      version: 3,
    });
  });

  it("shouldShowRequiredErrors_whenNameAndHeadlineAreEmpty", async () => {
    server.use(signedIn(), profileExists());
    const { user } = await openProfile();

    await user.clear(await screen.findByLabelText("Ad soyad"));
    await user.clear(inLanguagePanel().getByLabelText("Unvan"));
    await user.clear(inLanguagePanel().getByLabelText("Kısa tanıtım"));
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByText("Bu alan gerekli.")).toBeInTheDocument();
    expect(screen.getByText("En az bir dilde içerik gir.")).toBeInTheDocument();
  });

  it("shouldSwitchToEnglish_whenOnlyEnglishIsIncomplete", async () => {
    server.use(signedIn(), profileExists());
    const { user } = await openProfile();
    await user.click(await screen.findByRole("tab", { name: "EN" }));
    await user.type(inLanguagePanel().getByLabelText("Kısa tanıtım"), "Only an intro, no headline");
    await user.click(screen.getByRole("tab", { name: "TR" }));

    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByRole("tab", { name: /EN/, selected: true })).toBeInTheDocument();
    expect(screen.getByText("Bu alan gerekli.")).toBeInTheDocument();
  });

  it("shouldReorderAndRemoveLinks_whenSaved", async () => {
    let sent: { socialLinks?: unknown } = {};
    server.use(
      signedIn(),
      profileExists(),
      http.put("/api/admin/profile", async ({ request, response }) => {
        sent = await request.json();
        return response(200).json({ ...saved, version: 4 });
      }),
    );
    const { user } = await openProfile();

    await user.click(await screen.findByRole("button", { name: "GitHub linkini yukarı taşı" }));
    await user.click(screen.getByRole("button", { name: "Medium linkini kaldır" }));
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    await screen.findByText(/Kaydedildi/);
    expect(sent.socialLinks).toEqual([
      { platform: "GITHUB", url: "https://github.com/example" },
      { platform: "LINKEDIN", url: "https://www.linkedin.com/in/example" },
    ]);
  });

  it("shouldOfferReload_whenProfileChangedElsewhere", async () => {
    let version = 3;
    server.use(
      signedIn(),
      http.get("/api/admin/profile", ({ response }) =>
        response(200).json(
          version === 3 ? saved : { ...saved, fullName: "Başka sekmede değişti", version },
        ),
      ),
      http.put("/api/admin/profile", ({ response }) => {
        version = 4;
        return response.untyped(problem(409, "The change conflicts with existing data"));
      }),
    );
    const { user } = await openProfile();
    await user.type(await screen.findByLabelText("Konum"), " (merkez)");

    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("başka bir yerde değişti");
    await user.click(within(alert).getByRole("button", { name: "Yeniden yükle" }));

    expect(await screen.findByDisplayValue("Başka sekmede değişti")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
