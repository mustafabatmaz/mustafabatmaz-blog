import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { altLanguages, mediaName } from "@/features/media/mediaSchema";
import { useMediaItems } from "@/features/media/useMedia";
import { CoverPicker } from "./CoverPicker";

interface CoverFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

// The cover is a media id; its preview comes from the media list (cached once the picker has loaded it)
export function CoverField({ value, onChange }: CoverFieldProps) {
  const labelId = useId();
  const media = useMediaItems();
  const [picking, setPicking] = useState(false);
  const cover = value === null ? undefined : media.data?.find((item) => item.id === value);

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2.5">
      <span id={labelId} className="text-sm font-semibold">
        {tr.posts.cover}{" "}
        <span className="font-normal text-muted-foreground">({tr.posts.coverHint})</span>
      </span>
      {value === null && <p className="text-sm text-muted-foreground">{tr.posts.noCover}</p>}
      {cover && (
        <>
          <img
            src={cover.url}
            alt={tr.posts.coverPreview(mediaName(cover))}
            className="aspect-video w-full rounded-2xl bg-accent object-cover"
          />
          <span className="font-mono text-xs text-muted-foreground">
            {mediaName(cover)}
            {altLanguages(cover) && ` · ${tr.media.altStatus(altLanguages(cover))}`}
          </span>
        </>
      )}
      {value !== null && media.isSuccess && !cover && (
        <p className="text-sm text-destructive">{tr.posts.coverMissing}</p>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPicking(true);
          }}
        >
          {value === null ? tr.posts.chooseCover : tr.posts.changeCover}
        </Button>
        {value !== null && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null);
            }}
          >
            {tr.posts.removeCover}
          </Button>
        )}
      </div>
      {picking && (
        <CoverPicker
          current={value}
          onPick={(id) => {
            onChange(id);
            setPicking(false);
          }}
          onClose={() => {
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
