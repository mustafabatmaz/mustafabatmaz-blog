import { UploadIcon } from "lucide-react";
import { useState, type RefObject } from "react";
import { cn } from "cn";
import { tr } from "@/i18n/tr";
import { ACCEPTED_TYPES } from "./mediaFiles";

interface UploadZoneProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: File[]) => void;
}

// Dropping is a shortcut for mouse users; the real control is the file input, opened by the buttons
// (here and in the page header), so the keyboard path is the browser's own file dialog
export function UploadZone({ inputRef, onFiles }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-input bg-card px-6 py-7 text-center transition-colors",
        dragging && "border-primary bg-accent",
      )}
      onDragOver={(event) => {
        // Without preventDefault the browser opens the dropped file instead of letting us have it
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => {
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <UploadIcon aria-hidden="true" className="size-7 text-link" />
      <p className="font-semibold">
        <span>{tr.media.dropTitle} </span>
        <button
          type="button"
          className="text-link underline underline-offset-4"
          onClick={() => inputRef.current?.click()}
        >
          {tr.media.choose}
        </button>
      </p>
      <p className="font-mono text-xs text-muted-foreground">{tr.media.dropHint}</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        aria-label={tr.media.fileInput}
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          // Lets the same file be chosen again after a failed attempt
          event.target.value = "";
        }}
      />
    </div>
  );
}
