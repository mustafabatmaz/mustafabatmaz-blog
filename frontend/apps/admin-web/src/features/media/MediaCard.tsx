import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { formatDate } from "@/lib/format";
import { formatBytes } from "./mediaFiles";
import { altLanguages, mediaName, type MediaItem } from "./mediaSchema";
import { StatusBadge } from "./StatusBadge";

// Kept free of page state so the post cover picker (4e) can show the same card
export function MediaCard({ item, onEdit }: { item: MediaItem; onEdit: () => void }) {
  const name = mediaName(item);
  const languages = altLanguages(item);
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
      {/* The file name next to it already says what this is, so the thumbnail is decorative here */}
      <img
        src={item.url}
        alt=""
        loading="lazy"
        className="aspect-4/3 w-full bg-accent object-cover"
      />
      <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-mono text-[13px]">{name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {item.format} · {formatBytes(item.sizeBytes ?? 0)}
            {item.createdAt && ` · ${formatDate(item.createdAt)}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {languages ? (
            <StatusBadge tone="mint">{tr.media.altStatus(languages)}</StatusBadge>
          ) : (
            <StatusBadge tone="muted">{tr.media.noAlt}</StatusBadge>
          )}
          {item.metadataStripped === false && (
            <StatusBadge tone="danger">{tr.media.notStrippedBadge}</StatusBadge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          aria-label={tr.media.editLabel(name)}
          onClick={onEdit}
        >
          {tr.media.edit}
        </Button>
      </div>
    </div>
  );
}
