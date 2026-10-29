import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { editorIn, typeInEditor } from "@/test/codemirror";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownField } from "./MarkdownField";

describe("MarkdownEditor", () => {
  it("shouldReportText_whenUserTypes", () => {
    const onChange = vi.fn();
    const { container } = render(<MarkdownEditor value="" onChange={onChange} labelId="body" />);

    typeInEditor(editorIn(container), "## Başlık");

    expect(onChange).toHaveBeenLastCalledWith("## Başlık");
  });

  it("shouldShowNewText_whenValueChangesFromOutside", () => {
    const { container, rerender } = render(
      <MarkdownEditor value="eski" onChange={vi.fn()} labelId="body" />,
    );

    rerender(<MarkdownEditor value="yeni metin" onChange={vi.fn()} labelId="body" />);

    expect(editorIn(container).state.doc.toString()).toBe("yeni metin");
  });

  it("shouldNotReportChange_whenValueChangesFromOutside", () => {
    const onChange = vi.fn();
    const { rerender } = render(<MarkdownEditor value="eski" onChange={onChange} labelId="body" />);

    rerender(<MarkdownEditor value="sunucudan gelen" onChange={onChange} labelId="body" />);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("shouldLinkEditorToLabelAndError_whenFieldIsInvalid", () => {
    const { container } = render(
      <MarkdownEditor
        value=""
        onChange={vi.fn()}
        labelId="body-label"
        describedBy="body-error"
        invalid
      />,
    );

    const content = container.querySelector(".cm-content");
    expect(content).toHaveAttribute("aria-labelledby", "body-label");
    expect(content).toHaveAttribute("aria-describedby", "body-error");
    expect(content).toHaveAttribute("aria-invalid", "true");
  });
});

describe("MarkdownField", () => {
  function ControlledField() {
    const [value, setValue] = useState("");
    return <MarkdownField value={value} onChange={setValue} labelId="body-label" />;
  }

  it("shouldRenderPreview_whenUserTypesMarkdown", async () => {
    const { container } = render(<ControlledField />);

    typeInEditor(editorIn(container), "## Merhaba\n\n- birinci madde");

    expect(await screen.findByRole("heading", { name: "Merhaba" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("birinci madde");
  });
});
