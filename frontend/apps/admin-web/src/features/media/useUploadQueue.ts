import { useRef, useState } from "react";
import { useAnnounce } from "@/components/announcer/useAnnounce";
import { tr } from "@/i18n/tr";
import { checkFile, uploadProblem, type UploadProblem } from "./mediaFiles";
import type { MediaItem } from "./mediaSchema";
import { useUploadMedia } from "./useMedia";

export interface UploadEntry {
  key: number;
  name: string;
  size: number;
  status: "waiting" | "uploading" | "done" | "error";
  problem?: UploadProblem;
  media?: MediaItem;
}

// The rows only describe this visit's uploads, so they live in component state, not in the query cache.
// Files go up one at a time, in the order they were chosen, even when more are added mid-way.
export function useUploadQueue() {
  const upload = useUploadMedia();
  const announce = useAnnounce();
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  // Refs keep a value between renders without causing one (like a plain class field in an Angular component)
  const nextKey = useRef(0);
  const queue = useRef(Promise.resolve());

  const update = (key: number, change: Partial<UploadEntry>) => {
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, ...change } : entry)),
    );
  };

  const send = async (key: number, file: File) => {
    update(key, { status: "uploading" });
    try {
      const media = await upload.mutateAsync(file);
      update(key, { status: "done", media });
      announce(tr.media.uploadedAnnouncement(file.name));
    } catch (error) {
      update(key, { status: "error", problem: uploadProblem(error) });
      announce(tr.media.failedAnnouncement(file.name));
    }
  };

  const add = (files: readonly File[]) => {
    const added = files.map((file) => {
      const problem = checkFile(file);
      const entry: UploadEntry = {
        key: nextKey.current++,
        name: file.name,
        size: file.size,
        ...(problem ? { status: "error", problem } : { status: "waiting" }),
      };
      return { entry, file };
    });
    setEntries((current) => [...current, ...added.map(({ entry }) => entry)]);
    for (const { entry, file } of added) {
      if (entry.status === "error") {
        announce(tr.media.failedAnnouncement(file.name));
      } else {
        queue.current = queue.current.then(() => send(entry.key, file));
      }
    }
  };

  const dismiss = (key: number) => {
    setEntries((current) => current.filter((entry) => entry.key !== key));
  };

  return { entries, add, dismiss };
}
