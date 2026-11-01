import { createHash, timingSafeEqual } from "node:crypto";

// For POST /api/revalidate (6a decision 4). Not configured means every request is refused. Comparing digests
// keeps the lengths equal, which timingSafeEqual needs, so the time taken says nothing about the secret.
export function isAuthorized(header: string | null, secret: string | undefined) {
  if (!secret || !header) {
    return false;
  }
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}
