import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { createMemoryRouter, Link } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { UnsavedChangesGuard } from "./UnsavedChangesGuard";

function EditPage() {
  const [text, setText] = useState("");
  return (
    <>
      <h1>Düzenle</h1>
      <label htmlFor="text">Metin</label>
      <input
        id="text"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <Link to="/other">Başka bölüm</Link>
      <Link to="/login">Giriş</Link>
      <UnsavedChangesGuard isDirty={text !== ""} />
    </>
  );
}

function renderEditPage() {
  const router = createMemoryRouter(
    [
      { path: "/edit", Component: EditPage },
      { path: "/other", element: <h1>Başka bölüm</h1> },
      { path: "/login", element: <h1>Giriş yap</h1> },
    ],
    { initialEntries: ["/edit"] },
  );
  render(<RouterProvider router={router} />);
  return { router, user: userEvent.setup() };
}

describe("unsaved changes guard", () => {
  it("shouldAskBeforeLeaving_whenFormHasChanges", async () => {
    const { user } = renderEditPage();
    await user.type(screen.getByLabelText("Metin"), "yarım kalan metin");

    await user.click(screen.getByRole("link", { name: "Başka bölüm" }));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Kaydedilmemiş değişiklikler");
  });

  it("shouldStayOnPage_whenUserChoosesToStay", async () => {
    const { router, user } = renderEditPage();
    await user.type(screen.getByLabelText("Metin"), "yarım kalan metin");
    await user.click(screen.getByRole("link", { name: "Başka bölüm" }));

    await user.click(await screen.findByRole("button", { name: "Sayfada kal" }));

    expect(router.state.location.pathname).toBe("/edit");
    expect(screen.getByLabelText("Metin")).toHaveValue("yarım kalan metin");
  });

  it("shouldLeave_whenUserConfirms", async () => {
    const { user } = renderEditPage();
    await user.type(screen.getByLabelText("Metin"), "yarım kalan metin");
    await user.click(screen.getByRole("link", { name: "Başka bölüm" }));

    await user.click(await screen.findByRole("button", { name: "Çık" }));

    expect(await screen.findByRole("heading", { name: "Başka bölüm" })).toBeInTheDocument();
  });

  it("shouldLeaveWithoutAsking_whenFormIsClean", async () => {
    const { user } = renderEditPage();

    await user.click(screen.getByRole("link", { name: "Başka bölüm" }));

    expect(await screen.findByRole("heading", { name: "Başka bölüm" })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shouldNotBlockLoginRedirect_whenSessionEnds", async () => {
    const { user } = renderEditPage();
    await user.type(screen.getByLabelText("Metin"), "yarım kalan metin");

    await user.click(screen.getByRole("link", { name: "Giriş" }));

    expect(await screen.findByRole("heading", { name: "Giriş yap" })).toBeInTheDocument();
  });
});
