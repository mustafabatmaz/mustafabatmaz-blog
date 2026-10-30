import { ApiError } from "@/lib/problem";

// Spring's "5MB" (blog.media.max-file-size) is 5 × 1024 × 1024 bytes
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export type FileProblem = "empty" | "tooLarge" | "unsupported";
export type UploadProblem = FileProblem | "invalid" | "failed";

// Saves a pointless upload when the browser already knows the file won't do. The browser's type comes
// from the extension, so it's only a hint: an unknown type goes through and the backend decides from the bytes.
export function checkFile(file: { size: number; type: string }): FileProblem | null {
  if (file.size === 0) {
    return "empty";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "tooLarge";
  }
  if (file.type !== "" && !(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return "unsupported";
  }
  return null;
}

const byStatus: Partial<Record<number, UploadProblem>> = {
  400: "invalid",
  413: "tooLarge",
  415: "unsupported",
};

export function uploadProblem(error: unknown): UploadProblem {
  return (error instanceof ApiError ? byStatus[error.status] : undefined) ?? "failed";
}

const KB = 1024;
const MB = KB * 1024;
const megabytes = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

// "512 B", "284 KB", "1,8 MB"
export function formatBytes(bytes: number) {
  if (bytes < KB) {
    return `${String(bytes)} B`;
  }
  if (bytes < MB) {
    return `${String(Math.round(bytes / KB))} KB`;
  }
  return `${megabytes.format(bytes / MB)} MB`;
}
