import { revalidatePath } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Next's own cache module (only works inside a running Next server); the same exception as next/navigation
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const SECRET = "test-only-revalidate-secret";

const call = (authorization?: string) =>
  POST(
    new Request("http://localhost:3000/api/revalidate", {
      method: "POST",
      headers: authorization === undefined ? {} : { Authorization: authorization },
    }),
  );

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.stubEnv("REVALIDATE_SECRET", SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(revalidatePath).mockClear();
  });

  it("shouldMarkTheWholeSiteStale_whenTheBackendSendsTheSecret", () => {
    const response = call(`Bearer ${SECRET}`);

    expect(response.status).toBe(204);
    expect(revalidatePath).toHaveBeenCalledWith("/[locale]", "layout");
  });

  it("shouldRefuse_whenTheSecretIsWrongOrMissing", () => {
    expect(call("Bearer wrong").status).toBe(401);
    expect(call(SECRET).status).toBe(401);
    expect(call().status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("shouldRefuseEverything_whenNoSecretIsConfigured", () => {
    vi.stubEnv("REVALIDATE_SECRET", "");

    expect(call("Bearer ").status).toBe(401);
    expect(call(`Bearer ${SECRET}`).status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
