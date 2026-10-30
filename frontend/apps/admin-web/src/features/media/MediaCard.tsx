import { cn } from "cn";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { formatDate } from "@/lib/format";
import { formatBytes } from "./mediaFiles";
import { altLanguages, mediaName, type MediaItem } from "./mediaSchema";

interface MediaCardProps {
  item: MediaItem;
  // "Düzenle" on the media page, "Seç" in the post cover picker
  actionLabel: string;
  actionName: (name: string) => string;
  onAction: () => void;
  // Shown instead of the action, e.g. for the post's current cover
  current?: string | undefined;
}

export function MediaCard({ item, actionLabel, actionName, onAction, current }: MediaCardProps) {
  const name = mediaName(item);
  const languages = altLanguages(item);
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border bg-card",
        current && "border-2 border-primary",
      )}
    >
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
            {item.format} · {formatBytes(item.sizeBytes)}
            {item.createdAt && ` · ${formatDate(item.createdAt)}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {languages ? (
            <StatusBadge tone="mint">{tr.media.altStatus(languages)}</StatusBadge>
          ) : (
            <StatusBadge tone="muted">{tr.media.noAlt}</StatusBadge>
          )}
          {!item.metadataStripped && (
            <StatusBadge tone="danger">{tr.media.notStrippedBadge}</StatusBadge>
          )}
        </div>
        {current ? (
          <span className="inline-flex h-9 items-center self-start rounded-full bg-mint px-3.5 text-sm font-semibold text-mint-foreground">
            {current}
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            aria-label={actionName(name)}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
