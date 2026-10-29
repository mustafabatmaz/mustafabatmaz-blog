import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AnnouncerProvider } from "./AnnouncerProvider";
import { useAnnounce } from "./useAnnounce";

function MoveButton() {
  const announce = useAnnounce();
  return (
    <button
      type="button"
      onClick={() => {
        announce("IntelliJ IDEA 2. sıraya taşındı");
      }}
    >
      Taşı
    </button>
  );
}

describe("announcer", () => {
  it("shouldAnnounceMessageToScreenReaders_whenSomethingHappens", async () => {
    render(
      <AnnouncerProvider>
        <MoveButton />
      </AnnouncerProvider>,
    );

    await userEvent.setup().click(screen.getByRole("button", { name: "Taşı" }));

    expect(screen.getByRole("status")).toHaveTextContent("IntelliJ IDEA 2. sıraya taşındı");
  });
});
