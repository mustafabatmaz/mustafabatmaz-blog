import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { useAnnounce } from "@/components/announcer/useAnnounce";
import { ChipListField } from "@/components/form/ChipListField";
import { ConfirmDialog } from "@/components/form/ConfirmDialog";
import { FormField } from "@/components/form/FormField";
import { SaveErrorAlert } from "@/components/form/SaveErrorAlert";
import { SaveStatus } from "@/components/form/SaveStatus";
import { TranslationTabs } from "@/components/form/TranslationTabs";
import { UnsavedChangesGuard } from "@/components/form/UnsavedChangesGuard";
import { SKIP_UNSAVED_GUARD } from "@/components/form/useUnsavedChangesGuard";
import { LazyMarkdownField } from "@/components/markdown/LazyMarkdownField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { tr } from "@/i18n/tr";
import { formatDateTime } from "@/lib/format";
import { isProblem, PROBLEM_TYPES } from "@/lib/problem";
import { slugify } from "@/lib/slug";
import { firstLanguageWithErrors, LANGUAGES, type Language } from "@/lib/translations";
import { CoverField } from "./CoverField";
import { fromPost, MAX_TAGS, postSchema, postTitle, toPostRequest, type Post } from "./postSchema";
import { fromLocalInput, postState, timeZone, type PublishMode } from "./publishing";
import { useDeletePost, usePost, useSavePost, useTags } from "./usePosts";

// Set by the "new post" page when it hands over to the edit address after the first save
interface PostLocationState {
  savedAt?: number;
}

const tagTexts = {
  placeholder: tr.posts.tagPlaceholder,
  addHint: tr.posts.addTagHint,
  remove: tr.posts.removeTag,
  added: tr.posts.tagAdded,
  removed: tr.posts.tagRemoved,
};

const MODES: PublishMode[] = ["draft", "published", "scheduled"];

export function PostForm({ post }: { post: Post | null }) {
  const { refetch } = usePost(post?.id);
  const tags = useTags();
  const save = useSavePost();
  const remove = useDeletePost();
  const announce = useAnnounce();
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState<Language>("tr");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [savedAt, setSavedAt] = useState(() => {
    const handedOver = (location.state as PostLocationState | null)?.savedAt;
    return handedOver ? new Date(handedOver) : undefined;
  });
  const form = useForm({ resolver: zodResolver(postSchema), defaultValues: fromPost(post) });
  const { errors, isDirty } = form.formState;
  const [mode, publishAt, translations] = useWatch({
    control: form.control,
    name: ["mode", "publishAt", "translations"],
  });

  const savedSlug = (lang: Language) => post?.translations.find((t) => t.lang === lang)?.slug;
  // Only a post that is live has addresses that a changed slug would break
  const live = post !== null && postState(post) === "published";

  const slugHint = (lang: Language) => {
    const saved = savedSlug(lang);
    if (!saved) {
      return tr.posts.slugAuto;
    }
    return live && translations[lang].slug !== saved
      ? tr.posts.slugChangeWarning(`/${lang}/writing/${saved}`)
      : undefined;
  };

  const modeHint = (option: PublishMode) => {
    if (option === "published") {
      return live && post.publishedAt
        ? tr.posts.modeHints.publishedAt(formatDateTime(post.publishedAt))
        : tr.posts.modeHints.publishNow;
    }
    return option === "draft" ? tr.posts.modeHints.draft : tr.posts.modeHints.scheduled;
  };

  const scheduledFor = mode === "scheduled" ? fromLocalInput(publishAt) : undefined;

  const submit = form.handleSubmit(
    (values) => {
      save.mutate(
        { id: post?.id, body: toPostRequest(values, post, new Date()) },
        {
          onSuccess: (saved) => {
            form.reset(fromPost(saved));
            if (post) {
              setSavedAt(new Date());
            } else {
              // Later saves are updates; replace so Back doesn't return to an empty "new post" form
              void navigate(`/posts/${String(saved.id)}`, {
                replace: true,
                state: { savedAt: Date.now(), [SKIP_UNSAVED_GUARD]: true },
              });
            }
          },
          onError: (error) => {
            if (isProblem(error, PROBLEM_TYPES.slugTaken)) {
              // The backend names the languages; without them both slugs are suspects
              const taken = error.languages?.length ? error.languages : LANGUAGES;
              for (const lang of taken) {
                form.setError(`translations.${lang}.slug`, { message: tr.posts.slugTaken });
              }
              setLanguage(taken[0] ?? "tr");
            }
          },
        },
      );
    },
    (invalid) => {
      const withErrors = firstLanguageWithErrors(invalid.translations);
      if (withErrors) {
        setLanguage(withErrors);
      }
    },
  );

  const reload = () => {
    void refetch().then(({ data }) => {
      if (data) {
        form.reset(fromPost(data));
        save.reset();
      }
    });
  };

  const deletePost = () => {
    setConfirmingDelete(false);
    if (post?.id === undefined) {
      return;
    }
    const title = postTitle(post.translations);
    remove.mutate(post.id, {
      onSuccess: () => {
        announce(tr.posts.removed(title));
        void navigate("/posts", { state: { [SKIP_UNSAVED_GUARD]: true } });
      },
    });
  };

  const readingTimes = (post?.translations ?? [])
    .map((t) => tr.posts.minutes(t.lang.toUpperCase(), t.readingMinutes))
    .join(" · ");

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Link to="/posts" className="font-mono text-[13px] text-link">
            ← {tr.posts.back}
          </Link>
          <h1 className="text-4xl leading-tight font-bold tracking-tight">
            {post ? tr.posts.editTitle : tr.posts.newTitle}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SaveStatus isDirty={isDirty} isSaving={save.isPending} savedAt={savedAt} />
          {post && (
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                setConfirmingDelete(true);
              }}
            >
              {tr.posts.remove}
            </Button>
          )}
          <Button type="submit" disabled={save.isPending}>
            {tr.form.save}
          </Button>
        </div>
      </div>
      {/* A taken slug is shown on its slug field instead */}
      <SaveErrorAlert
        error={isProblem(save.error, PROBLEM_TYPES.slugTaken) ? null : save.error}
        onReload={reload}
      />
      {remove.isError && (
        <p role="alert" className="rounded-2xl bg-destructive-soft px-4.5 py-3.5 text-destructive">
          {tr.posts.deleteFailed}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-label={tr.posts.content}
          className="flex min-w-0 flex-[999_1_520px] flex-col gap-5"
        >
          <TranslationTabs
            value={language}
            onValueChange={setLanguage}
            errors={errors.translations}
          >
            {(lang) => (
              <div className="flex flex-col gap-5">
                <FormField
                  id={`post-title-${lang}`}
                  label={tr.posts.postTitle}
                  error={errors.translations?.[lang]?.title?.message}
                >
                  {(field) => (
                    <Input
                      {...field}
                      className="h-12 text-lg font-semibold"
                      {...form.register(`translations.${lang}.title`, {
                        // The slug follows the title until it's edited by hand, unless it's already saved
                        onChange: (event: { target: { value: string } }) => {
                          if (
                            !savedSlug(lang) &&
                            !form.getFieldState(`translations.${lang}.slug`).isDirty
                          ) {
                            form.setValue(`translations.${lang}.slug`, slugify(event.target.value));
                          }
                        },
                      })}
                    />
                  )}
                </FormField>
                <FormField
                  id={`post-slug-${lang}`}
                  label={tr.posts.slug}
                  error={errors.translations?.[lang]?.slug?.message}
                  hint={slugHint(lang)}
                >
                  {(field) => (
                    <div className="flex h-11 items-center overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                      <span
                        aria-hidden="true"
                        className="pr-1 pl-3.5 font-mono text-[13px] text-muted-foreground"
                      >
                        /{lang}/writing/
                      </span>
                      <input
                        {...field}
                        className="h-full min-w-0 flex-1 bg-transparent font-mono text-[13px] outline-none"
                        {...form.register(`translations.${lang}.slug`)}
                      />
                    </div>
                  )}
                </FormField>
                <FormField
                  id={`post-summary-${lang}`}
                  label={tr.posts.summary}
                  hint={tr.posts.summaryHint}
                  error={errors.translations?.[lang]?.summary?.message}
                >
                  {(field) => (
                    <Textarea
                      {...field}
                      rows={2}
                      {...form.register(`translations.${lang}.summary`)}
                    />
                  )}
                </FormField>
                <Controller
                  control={form.control}
                  name={`translations.${lang}.bodyMd`}
                  render={({ field, fieldState }) => (
                    <FormField
                      id={`post-body-${lang}`}
                      label={tr.posts.body}
                      error={fieldState.error?.message}
                    >
                      {(aria) => (
                        <LazyMarkdownField
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          labelId={`${aria.id}-label`}
                          describedBy={aria["aria-describedby"]}
                          invalid={aria["aria-invalid"]}
                        />
                      )}
                    </FormField>
                  )}
                />
              </div>
            )}
          </TranslationTabs>
        </section>

        <aside
          aria-label={tr.posts.settings}
          className="flex min-w-0 flex-[1_1_300px] flex-col gap-5.5 rounded-2xl border bg-card p-6"
        >
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-sm font-semibold">{tr.posts.publication}</legend>
            {MODES.map((option) => (
              <label key={option} className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="radio"
                  value={option}
                  className="mt-0.5 size-4.5 accent-primary"
                  {...form.register("mode")}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{tr.posts.modes[option]}</span>
                  <span className="text-[13px] text-muted-foreground">{modeHint(option)}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {mode === "scheduled" && (
            <div className="flex flex-col gap-2">
              <FormField
                id="post-publish-at"
                label={tr.posts.publishAt}
                hint={tr.posts.publishAtHint(timeZone())}
                error={errors.publishAt?.message}
              >
                {(field) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    className="font-mono text-[13px]"
                    {...form.register("publishAt")}
                  />
                )}
              </FormField>
              {scheduledFor && (
                <span className="inline-flex h-6.5 items-center self-start rounded-full bg-accent px-3 text-[13px] font-semibold text-accent-foreground">
                  {tr.posts.scheduledBadge(formatDateTime(scheduledFor))}
                </span>
              )}
            </div>
          )}

          <Controller
            control={form.control}
            name="coverMediaId"
            render={({ field: { value, onChange } }) => (
              <CoverField value={value} onChange={onChange} />
            )}
          />

          <Controller
            control={form.control}
            name="tags"
            render={({ field: { value, onChange }, fieldState }) => (
              <FormField
                id="post-tags"
                label={tr.posts.tags}
                hint={tr.posts.tagsHint(value.length)}
                error={fieldState.error?.message}
              >
                {(field) => (
                  <ChipListField
                    field={field}
                    value={value}
                    onChange={onChange}
                    known={tags.data ?? []}
                    max={MAX_TAGS}
                    texts={tagTexts}
                  />
                )}
              </FormField>
            )}
          />

          {post && (
            <p className="border-t pt-4 font-mono text-xs leading-relaxed text-muted-foreground">
              {readingTimes && tr.posts.readingTime(readingTimes)}
              {post.updatedAt && (
                <>
                  <br />
                  {tr.posts.updatedAt(formatDateTime(post.updatedAt))}
                </>
              )}
            </p>
          )}
        </aside>
      </div>

      {post && (
        <ConfirmDialog
          open={confirmingDelete}
          title={tr.posts.deleteTitle}
          description={tr.posts.deleteDescription(postTitle(post.translations))}
          cancelLabel={tr.posts.cancel}
          confirmLabel={tr.posts.remove}
          destructive
          onCancel={() => {
            setConfirmingDelete(false);
          }}
          onConfirm={deletePost}
        />
      )}
      <UnsavedChangesGuard isDirty={isDirty} />
    </form>
  );
}
