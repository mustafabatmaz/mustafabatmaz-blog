import type { Schemas } from "@blog/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormField } from "@/components/form/FormField";
import { SaveErrorAlert } from "@/components/form/SaveErrorAlert";
import { SaveStatus } from "@/components/form/SaveStatus";
import { TranslationTabs } from "@/components/form/TranslationTabs";
import { UnsavedChangesGuard } from "@/components/form/UnsavedChangesGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { LazyMarkdownField } from "@/components/markdown/LazyMarkdownField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tr } from "@/i18n/tr";
import { formatDateTime } from "@/lib/format";
import { firstLanguageWithErrors, type Language } from "@/lib/translations";
import { fromPage, pageSchema, toPageRequest, type PageKey } from "./pageSchema";
import { PageSwitch } from "./PageSwitch";
import { usePage, useSavePage } from "./usePage";

interface PageFormProps {
  pageKey: PageKey;
  page: Schemas["PageAdminResponse"] | null;
}

export function PageForm({ pageKey, page }: PageFormProps) {
  const { refetch } = usePage(pageKey);
  const save = useSavePage(pageKey);
  const [language, setLanguage] = useState<Language>("tr");
  const [savedAt, setSavedAt] = useState<Date>();
  const form = useForm({ resolver: zodResolver(pageSchema), defaultValues: fromPage(page) });
  const { errors, isDirty } = form.formState;

  const submit = form.handleSubmit(
    (values) => {
      save.mutate(toPageRequest(values, page?.version), {
        onSuccess: (saved) => {
          form.reset(fromPage(saved));
          setSavedAt(new Date());
        },
      });
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
      if (data !== undefined) {
        form.reset(fromPage(data));
        save.reset();
      }
    });
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <PageHeader
        kicker={tr.nav.profileGroup}
        title={tr.pages.title}
        actions={
          <>
            <SaveStatus isDirty={isDirty} isSaving={save.isPending} savedAt={savedAt} />
            <Button type="submit" disabled={save.isPending}>
              {tr.form.save}
            </Button>
          </>
        }
      />
      <PageSwitch />
      <SaveErrorAlert error={save.error} onReload={reload} />
      <p className="font-mono text-xs text-muted-foreground">
        {page?.updatedAt ? tr.pages.updatedAt(formatDateTime(page.updatedAt)) : tr.pages.neverSaved}
      </p>

      <TranslationTabs value={language} onValueChange={setLanguage} errors={errors.translations}>
        {(lang) => (
          <>
            <FormField
              id={`title-${lang}`}
              label={tr.pages.titleField}
              error={errors.translations?.[lang]?.title?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  className="h-12 text-lg font-semibold"
                  {...form.register(`translations.${lang}.title`)}
                />
              )}
            </FormField>
            {/* Controller connects a component that isn't a plain input (Angular: ControlValueAccessor) */}
            <Controller
              control={form.control}
              name={`translations.${lang}.bodyMd`}
              render={({ field, fieldState }) => (
                <FormField
                  id={`body-${lang}`}
                  label={tr.pages.body}
                  hint={tr.form.counter(field.value.length, 50000)}
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
          </>
        )}
      </TranslationTabs>

      <UnsavedChangesGuard isDirty={isDirty} />
    </form>
  );
}
