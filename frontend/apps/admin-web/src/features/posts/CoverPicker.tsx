import { XIcon } from "lucide-react";
import { useRef } from "react";
import { LoadError, Loading } from "@/components/layout/QueryState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { tr } from "@/i18n/tr";
import { MediaCard } from "@/features/media/MediaCard";
import { UploadList } from "@/features/media/UploadList";
import { UploadZone } from "@/features/media/UploadZone";
import { useMediaItems } from "@/features/media/useMedia";
import { useUploadQueue } from "@/features/media/useUploadQueue";

interface CoverPickerProps {
  current: number | null;
  onPick: (id: number) => void;
  onClose: () => void;
}

// The media page's grid in a dialog. Uploads land at the top of the same cached list, ready to pick.
// Picking only fills the form; the post is saved with its own Save button.
export function CoverPicker({ current, onPick, onClose }: CoverPickerProps) {
  const media = useMediaItems();
  const uploads = useUploadQueue();
  const fileInput = useRef<HTMLInputElement>(null);
  const items = media.data ?? [];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-5xl">
        <div className="flex flex-col gap-4.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <DialogTitle>{tr.posts.pickerTitle}</DialogTitle>
              <p className="font-mono text-xs text-muted-foreground">{tr.posts.pickerHint}</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={tr.posts.close} onClick={onClose}>
              <XIcon aria-hidden="true" />
            </Button>
          </div>

          <UploadZone inputRef={fileInput} onFiles={uploads.add} />
          <UploadList entries={uploads.entries} onDismiss={uploads.dismiss} />

          {media.isPending && <Loading />}
          {media.isError && <LoadError onRetry={() => void media.refetch()} />}
          {media.isSuccess && items.length === 0 && (
            <p className="text-muted-foreground">{tr.posts.noMedia}</p>
          )}
          {items.length > 0 && (
            <ul
              aria-label={tr.media.gallery}
              className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5"
            >
              {items.map((item) => (
                <li key={item.id}>
                  <MediaCard
                    item={item}
                    actionLabel={tr.posts.choose}
                    actionName={tr.posts.chooseLabel}
                    current={item.id === current ? tr.posts.currentCover : undefined}
                    onAction={() => {
                      if (item.id !== undefined) {
                        onPick(item.id);
                      }
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              {tr.posts.cancel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
