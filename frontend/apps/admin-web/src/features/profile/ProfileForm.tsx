import type { Schemas } from "@blog/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/form/FormField";
import { FormSection } from "@/components/form/FormSection";
import { SaveErrorAlert } from "@/components/form/SaveErrorAlert";
import { SaveStatus } from "@/components/form/SaveStatus";
import { TranslationTabs } from "@/components/form/TranslationTabs";
import { UnsavedChangesGuard } from "@/components/form/UnsavedChangesGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { tr } from "@/i18n/tr";
import { firstLanguageWithErrors, type Language } from "@/lib/translations";
import { fromProfile, profileSchema, toProfileRequest } from "./profileSchema";
import { SocialLinksField } from "./SocialLinksField";
import { useProfile, useSaveProfile } from "./useProfile";

// Rendered only once the profile has loaded, so the form starts from the saved values
export function ProfileForm({ profile }: { profile: Schemas["ProfileAdminResponse"] | null }) {
  const { refetch } = useProfile();
  const save = useSaveProfile();
  const [language, setLanguage] = useState<Language>("tr");
  const [savedAt, setSavedAt] = useState<Date>();
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: fromProfile(profile),
  });
  const { errors, isDirty } = form.formState;
  const intro = useWatch({ control: form.control, name: `translations.${language}.intro` });

  const submit = form.handleSubmit(
    (values) => {
      save.mutate(toProfileRequest(values, profile?.version), {
        onSuccess: (saved) => {
          // The saved record becomes the new baseline: fresh version, form no longer dirty
          form.reset(fromProfile(saved));
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
        form.reset(fromProfile(data));
        save.reset();
      }
    });
  };

  return (
    <form
      noValidate
      className="flex max-w-225 flex-col gap-6"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <PageHeader
        kicker={tr.nav.profileGroup}
        title={tr.profile.title}
        actions={
          <>
            <SaveStatus isDirty={isDirty} isSaving={save.isPending} savedAt={savedAt} />
            <Button type="submit" disabled={save.isPending}>
              {tr.form.save}
            </Button>
          </>
        }
      />
      <SaveErrorAlert error={save.error} onReload={reload} />

      <FormSection title={tr.profile.identity}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField id="fullName" label={tr.profile.fullName} error={errors.fullName?.message}>
              {(field) => <Input {...field} autoComplete="name" {...form.register("fullName")} />}
            </FormField>
          </div>
          <FormField
            id="email"
            label={tr.profile.email}
            hint={tr.profile.emailHint}
            error={errors.email?.message}
          >
            {(field) => <Input {...field} type="email" {...form.register("email")} />}
          </FormField>
          <FormField
            id="location"
            label={tr.profile.location}
            hint={tr.profile.locationHint}
            error={errors.location?.message}
          >
            {(field) => <Input {...field} {...form.register("location")} />}
          </FormField>
        </div>
      </FormSection>

      <FormSection title={tr.profile.introSection}>
        <TranslationTabs value={language} onValueChange={setLanguage} errors={errors.translations}>
          {(lang) => (
            <>
              <FormField
                id={`headline-${lang}`}
                label={tr.profile.headline}
                error={errors.translations?.[lang]?.headline?.message}
              >
                {(field) => (
                  <Input {...field} {...form.register(`translations.${lang}.headline`)} />
                )}
              </FormField>
              <FormField
                id={`intro-${lang}`}
                label={tr.profile.intro}
                hint={lang === language ? tr.form.counter(intro.length, 2000) : undefined}
                error={errors.translations?.[lang]?.intro?.message}
              >
                {(field) => (
                  <Textarea {...field} rows={4} {...form.register(`translations.${lang}.intro`)} />
                )}
              </FormField>
            </>
          )}
        </TranslationTabs>
        <p className="text-[13px] text-muted-foreground">{tr.profile.blankLanguageHint}</p>
      </FormSection>

      <FormSection title={tr.profile.links}>
        <SocialLinksField
          control={form.control}
          register={form.register}
          errors={errors.socialLinks}
        />
      </FormSection>

      <UnsavedChangesGuard isDirty={isDirty} />
    </form>
  );
}
