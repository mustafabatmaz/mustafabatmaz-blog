import type { Schemas } from "@blog/api-client";

type Media = Schemas["MediaAdminResponse"];

export function media(id: number, originalFilename: string, extra: Partial<Media> = {}): Media {
  return {
    id,
    url: `/api/public/media/uuid-${String(id)}.png`,
    format: "PNG",
    contentType: "image/png",
    sizeBytes: 284 * 1024,
    originalFilename,
    metadataStripped: true,
    translations: [],
    version: 0,
    createdAt: "2026-10-28T09:12:00Z",
    updatedAt: "2026-10-28T09:12:00Z",
    ...extra,
  };
}

export function png(name: string, size = 1024) {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}
