import type { Schemas } from "@blog/api-client";
import { z } from "zod";
import { tr } from "@/i18n/tr";
import { isSlug } from "@/lib/slug";
import { fromTranslations, toTranslations, translationsSchema } from "@/lib/translations";
import {
  fromLocalInput,
  postState,
  publishedAtFor,
  toLocalInput,
  type PublishMode,
} from "./publishing";

export type Post = Schemas["PostAdminResponse"];
export type PostSummary = Schemas["PostAdminSummary"];

// Same limits as the backend's PostAdminRequest
export const MAX_TAGS = 10;

const emptyTranslation = { title: "", slug: "", summary: "", bodyMd: "" };

// now is a parameter so tests can pin "the future"
export function createPostSchema(now: () => Date = () => new Date()) {
  return z
    .object({
      mode: z.enum(["draft", "published", "scheduled"]),
      publishAt: z.string(),
      coverMediaId: z.number().nullable(),
      tags: z.array(z.string().max(50, tr.form.tooLong(50))).max(MAX_TAGS, tr.posts.tooManyTags),
      translations: translationsSchema(
        {
          title: z.string().max(200, tr.form.tooLong(200)),
          slug: z
            .string()
            .trim()
            .max(150, tr.form.tooLong(150))
            .refine((value) => value === "" || isSlug(value), tr.posts.slugFormat),
          summary: z.string().max(500, tr.form.tooLong(500)),
          bodyMd: z.string().max(200_000, tr.form.tooLong(200_000)),
        },
        ["title", "slug", "bodyMd"],
      ),
    })
    .superRefine((value, ctx) => {
      if (value.mode !== "scheduled") {
        return;
      }
      const at = fromLocalInput(value.publishAt);
      if (!at) {
        ctx.addIssue({ code: "custom", path: ["publishAt"], message: tr.posts.publishAtRequired });
      } else if (new Date(at) <= now()) {
        ctx.addIssue({ code: "custom", path: ["publishAt"], message: tr.posts.publishAtPast });
      }
    });
}

export const postSchema = createPostSchema();

export type PostFormValues = z.input<typeof postSchema>;

// null: a new post
export function fromPost(post: Post | null): PostFormValues {
  const mode: PublishMode = post ? postState(post) : "draft";
  return {
    mode,
    publishAt: mode === "scheduled" && post?.publishedAt ? toLocalInput(post.publishedAt) : "",
    coverMediaId: post?.coverMediaId ?? null,
    tags: post?.tags ?? [],
    translations: fromTranslations(post?.translations, emptyTranslation),
  };
}

export function toPostRequest(
  values: z.output<typeof postSchema>,
  saved: Post | null,
  now: Date,
): Schemas["PostAdminRequest"] {
  const publishedAt = publishedAtFor(values.mode, values.publishAt, saved, now);
  return {
    status: values.mode === "draft" ? "DRAFT" : "PUBLISHED",
    ...(publishedAt ? { publishedAt } : {}),
    ...(values.coverMediaId === null ? {} : { coverMediaId: values.coverMediaId }),
    translations: toTranslations(values.translations).map(
      ({ lang, title, slug, bodyMd, summary }) => ({
        lang,
        title: title ?? "",
        slug: slug ?? "",
        bodyMd: bodyMd ?? "",
        ...(summary ? { summary } : {}),
      }),
    ),
    tags: values.tags,
    version: saved?.version,
  };
}

// Turkish title first, English if that's all there is
export function postTitle(translations: readonly { lang?: "tr" | "en"; title?: string }[] = []) {
  const byLang = (lang: "tr" | "en") => translations.find((t) => t.lang === lang)?.title;
  return byLang("tr") ?? byLang("en") ?? tr.posts.untitled;
}
