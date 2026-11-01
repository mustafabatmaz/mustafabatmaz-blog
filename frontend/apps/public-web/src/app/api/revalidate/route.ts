import { revalidatePath } from "next/cache";
import { isAuthorized } from "@/lib/revalidate";

// The backend calls this after every admin change (6a). Called from a Route Handler, revalidatePath only marks
// pages stale; each one is rebuilt on its next visit, so refreshing the whole site costs nothing up front
// (6a decision 1). The secret travels in a header, never in the URL, which ends up in logs.
export function POST(request: Request) {
  if (!isAuthorized(request.headers.get("Authorization"), process.env.REVALIDATE_SECRET)) {
    return new Response(null, { status: 401 });
  }
  revalidatePath("/[locale]", "layout");
  return new Response(null, { status: 204 });
}
