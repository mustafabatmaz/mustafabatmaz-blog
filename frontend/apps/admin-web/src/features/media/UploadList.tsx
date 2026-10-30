import { XIcon } from "lucide-react";
import { useId } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { formatBytes } from "./mediaFiles";
import { StatusBadge } from "@/components/layout/StatusBadge";
import type { UploadEntry } from "./useUploadQueue";

interface UploadListProps {
  entries: UploadEntry[];
  // Offers "add alt text" on finished rows; left out where that makes no sense (the cover picker)
  onEdit?: ((id: number) => void) | undefined;
  onDismiss: (key: number) => void;
}

function message(entry: UploadEntry) {
  if (entry.status === "done" && entry.media) {
    const size = formatBytes(entry.media.sizeBytes ?? entry.size);
    return `${size} · ${entry.media.metadataStripped === false ? tr.media.notStripped : tr.media.stripped}`;
  }
  if (entry.status === "error" && entry.problem) {
    const text = tr.media.problems[entry.problem];
    return entry.problem === "tooLarge" ? `${formatBytes(entry.size)} · ${text}` : text;
  }
  return formatBytes(entry.size);
}

function badge(entry: UploadEntry) {
  switch (entry.status) {
    case "waiting":
      return <StatusBadge tone="muted">{tr.media.waiting}</StatusBadge>;
    case "uploading":
      return <StatusBadge tone="accent">{tr.media.uploading}</StatusBadge>;
    case "done":
      return <StatusBadge tone="mint">{tr.media.uploaded}</StatusBadge>;
    case "error":
      return <StatusBadge tone="danger">{tr.media.notUploaded}</StatusBadge>;
  }
}

// Failed rows stay until dismissed, so a rejected file is never missed
export function UploadList({ entries, onEdit, onDismiss }: UploadListProps) {
  const titleId = useId();
  if (entries.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2.5">
      <h2 id={titleId} className="font-mono text-[13px] font-normal text-muted-foreground">
        {tr.media.uploads}
      </h2>
      <ul className="overflow-hidden rounded-2xl border bg-card">
        {entries.map((entry) => (
          <li
            key={entry.key}
            className="flex flex-wrap items-center gap-3 border-t py-3 pr-4 pl-5 first:border-t-0"
          >
            <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
              <span className="truncate font-mono text-[13px]">{entry.name}</span>
              <span
                className={cn(
                  "text-sm",
                  entry.status === "error" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {message(entry)}
              </span>
            </span>
            {badge(entry)}
            {onEdit && entry.status === "done" && entry.media?.id !== undefined && (
              <Button
                variant="link"
                size="sm"
                aria-label={tr.media.addAltTextFor(entry.name)}
                onClick={() => {
                  if (entry.media?.id !== undefined) {
                    onEdit(entry.media.id);
                  }
                }}
              >
                {tr.media.addAltText}
              </Button>
            )}
            {(entry.status === "done" || entry.status === "error") && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={tr.media.dismiss(entry.name)}
                onClick={() => {
                  onDismiss(entry.key);
                }}
              >
                <XIcon aria-hidden="true" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
