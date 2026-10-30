import { screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { signedIn } from "@/test/handlers";
import { page, summary } from "@/test/postFixtures";
import { renderApp } from "@/test/renderApp";
import { http, server } from "@/test/server";

const firstPage = page(
  [
    summary(1, "Spring Modulith ile modül sınırları"),
    summary(2, "Liquibase ile şema migrasyonları", {
      status: "PUBLISHED",
      scheduled: true,
      publishedAt: new Date(2026, 10, 3, 9, 0).toISOString(),
      translations: [
        { lang: "tr", slug: "liquibase", title: "Liquibase ile şema migrasyonları" },
        { lang: "en", slug: "liquibase-en", title: "Schema migrations with Liquibase" },
      ],
    }),
    summary(3, "Kafka'da kaybolan event'ler", {
      status: "PUBLISHED",
      publishedAt: new Date(2026, 9, 14, 9, 0).toISOString(),
    }),
  ],
  { totalItems: 23, totalPages: 2 },
);

// Records the query of every list request, so tests can check what the address asked for
function postsExist(requests: URLSearchParams[] = []) {
  return http.get("/api/admin/posts", ({ request, response }) => {
    const query = new URL(request.url).searchParams;
    requests.push(query);
    return response(200).json(
      query.get("page") === "2"
        ? page([summary(30, "Eski bir yazı")], { page: 2, totalItems: 23, totalPages: 2 })
        : firstPage,
    );
  });
}

async function openPosts(path = "/posts") {
  const result = renderApp(path);
  await screen.findByRole("heading", { name: "Yazılar" });
  return { ...result, user: userEvent.setup() };
}

function rows() {
  return within(screen.getByRole("table")).getAllByRole("row").slice(1);
}

describe("posts list", () => {
  it("shouldListPostsWithLanguagesAndStates_whenOpened", async () => {
    server.use(signedIn(), postsExist());

    await openPosts();

    expect(await screen.findByText("23 yazı")).toBeInTheDocument();
    const [draft, scheduled, published] = rows();
    expect(draft).toHaveTextContent("Taslak");
    expect(scheduled).toHaveTextContent("TR EN");
    expect(scheduled).toHaveTextContent("Zamanlandı");
    expect(scheduled).toHaveTextContent("03.11.2026");
    expect(published).toHaveTextContent("Yayında");
    expect(
      within(published).getByRole("link", { name: "Kafka'da kaybolan event'ler" }),
    ).toHaveAttribute("href", "/posts/3");
  });

  it("shouldShowEmptyState_whenThereAreNoPosts", async () => {
    server.use(
      signedIn(),
      http.get("/api/admin/posts", ({ response }) =>
        response(200).json(page([], { totalItems: 0, totalPages: 0 })),
      ),
    );

    await openPosts();

    expect(await screen.findByText(/Henüz yazı yok/)).toBeInTheDocument();
  });

  it("shouldAskForChosenStatus_andKeepItInTheAddress", async () => {
    const requests: URLSearchParams[] = [];
    server.use(signedIn(), postsExist(requests));
    const { user, router } = await openPosts();
    await screen.findByText("23 yazı");

    await user.click(screen.getByRole("button", { name: "Taslak" }));

    await waitFor(() => {
      expect(requests.at(-1)?.get("status")).toBe("DRAFT");
    });
    expect(router.state.location.search).toBe("?status=DRAFT");
    expect(screen.getByRole("button", { name: "Taslak" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shouldLoadNextPage_whenNextIsPressed", async () => {
    const requests: URLSearchParams[] = [];
    server.use(signedIn(), postsExist(requests));
    const { user, router } = await openPosts();
    await screen.findByText("Sayfa 1 / 2");
    expect(screen.getByRole("button", { name: "Önceki" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Sonraki" }));

    expect(await screen.findByText("Eski bir yazı")).toBeInTheDocument();
    expect(screen.getByText("Sayfa 2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sonraki" })).toBeDisabled();
    expect(router.state.location.search).toBe("?page=2");
  });

  it("shouldOpenPageAndFilterFromTheAddress", async () => {
    const requests: URLSearchParams[] = [];
    server.use(signedIn(), postsExist(requests));

    await openPosts("/posts?page=2&status=PUBLISHED");

    await waitFor(() => {
      expect(requests.at(-1)?.toString()).toBe("page=2&status=PUBLISHED");
    });
    expect(screen.getByRole("button", { name: "Yayında" })).toHaveAttribute("aria-pressed", "true");
  });
});
