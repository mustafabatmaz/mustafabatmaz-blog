import { PlusIcon } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "cn";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { MediaCard } from "./MediaCard";
import { MediaEditor } from "./MediaEditor";
import { hasAltText } from "./mediaSchema";
import { UploadList } from "./UploadList";
import { UploadZone } from "./UploadZone";
import { useMediaItems } from "./useMedia";
import { useUploadQueue } from "./useUploadQueue";

type Filter = "all" | "missingAlt";

export function MediaPage() {
  const media = useMediaItems();
  const uploads = useUploadQueue();
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<number>();
  const fileInput = useRef<HTMLInputElement>(null);

  const items = media.data ?? [];
  // Looked up by id, so the editor follows the cached item and closes once it's deleted
  const editing = items.find((item) => item.id === editingId);
  const missing = items.filter((item) => !hasAltText(item));
  const shown = filter === "all" ? items : missing;

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: tr.media.all(items.length) },
    { value: "missingAlt", label: tr.media.missingAlt(missing.length) },
  ];

  return (
    <>
      <PageHeader
        kicker={media.isSuccess ? tr.media.count(items.length, missing.length) : tr.nav.content}
        title={tr.media.title}
        actions={
          <Button onClick={() => fileInput.current?.click()}>
            <PlusIcon aria-hidden="true" />
            {tr.media.upload}
          </Button>
        }
      />

      <UploadZone inputRef={fileInput} onFiles={uploads.add} />
      <UploadList entries={uploads.entries} onEdit={setEditingId} onDismiss={uploads.dismiss} />

      {media.isPending && <Loading />}
      {media.isError && <LoadError onRetry={() => void media.refetch()} />}
      {media.isSuccess && items.length === 0 && (
        <p className="text-muted-foreground">{tr.media.empty}</p>
      )}

      {items.length > 0 && (
        <>
          <div role="group" aria-label={tr.media.filter} className="flex flex-wrap gap-1.5">
            {filters.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                className={cn(
                  "h-8.5 rounded-full border px-3.5 font-mono text-[13px]",
                  filter === option.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-input text-foreground hover:bg-muted",
                )}
                onClick={() => {
                  setFilter(option.value);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="text-muted-foreground">{tr.media.noneMissing}</p>
          ) : (
            <ul
              aria-label={tr.media.gallery}
              className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
            >
              {shown.map((item) => (
                <li key={item.id}>
                  <MediaCard
                    item={item}
                    actionLabel={tr.media.edit}
                    actionName={tr.media.editLabel}
                    onAction={() => {
                      setEditingId(item.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {editing && (
        <MediaEditor
          key={editing.id}
          item={editing}
          onClose={() => {
            setEditingId(undefined);
          }}
        />
      )}
    </>
  );
}
