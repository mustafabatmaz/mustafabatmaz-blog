import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ConfirmDialog } from "@/components/form/ConfirmDialog";
import { FormField } from "@/components/form/FormField";
import { SaveErrorAlert } from "@/components/form/SaveErrorAlert";
import { TranslationTabs } from "@/components/form/TranslationTabs";
import { UnsavedChangesGuard } from "@/components/form/UnsavedChangesGuard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { tr } from "@/i18n/tr";
import { firstLanguageWithErrors, type Language } from "@/lib/translations";
import {
  experienceSchema,
  fromExperience,
  toExperienceRequest,
  type Experience,
} from "./experienceSchema";
import { MonthYearField } from "./MonthYearField";
import { useExperiences, useSaveExperience } from "./useExperiences";

interface ExperienceEditorProps {
  experience: Experience | null;
  onClose: () => void;
  onSaved: (saved: Experience) => void;
}

// Same pattern as the uses dialog: mounted while editing, asks before throwing away changes
export function ExperienceEditor({ experience, onClose, onSaved }: ExperienceEditorProps) {
  const { refetch } = useExperiences();
  const save = useSaveExperience();
  const [language, setLanguage] = useState<Language>("tr");
  const [confirmingClose, setConfirmingClose] = useState(false);
  const form = useForm({
    resolver: zodResolver(experienceSchema),
    defaultValues: fromExperience(experience),
  });
  const { errors, isDirty } = form.formState;
  const current = useWatch({ control: form.control, name: "current" });

  const requestClose = () => {
    if (isDirty) {
      setConfirmingClose(true);
    } else {
      onClose();
    }
  };

  const submit = form.handleSubmit(
    (values) => {
      save.mutate(
        { id: experience?.id, body: toExperienceRequest(values, experience?.version) },
        {
          onSuccess: (saved) => {
            onSaved(saved);
            onClose();
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
      const fresh = data?.find((candidate) => candidate.id === experience?.id);
      if (fresh) {
        form.reset(fromExperience(fresh));
        save.reset();
      }
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          requestClose();
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>
              {experience ? tr.experience.editExperience : tr.experience.newExperience}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={tr.uses.close}
              onClick={requestClose}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
          <SaveErrorAlert error={save.error} onReload={reload} />

          <FormField
            id="experience-company"
            label={tr.experience.company}
            error={errors.company?.message}
          >
            {(field) => <Input {...field} {...form.register("company")} />}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <MonthYearField
              name="start"
              legend={tr.experience.start}
              register={form.register}
              error={errors.start?.message}
            />
            <div className="flex flex-col gap-2">
              <MonthYearField
                name="end"
                legend={tr.experience.end}
                register={form.register}
                error={current ? undefined : errors.end?.message}
                disabled={current}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4.5 accent-primary"
                  {...form.register("current")}
                />
                {tr.experience.stillWorking}
              </label>
            </div>
          </div>

          <TranslationTabs
            value={language}
            onValueChange={setLanguage}
            errors={errors.translations}
          >
            {(lang) => (
              <>
                <FormField
                  id={`experience-role-${lang}`}
                  label={tr.experience.role}
                  error={errors.translations?.[lang]?.roleTitle?.message}
                >
                  {(field) => (
                    <Input {...field} {...form.register(`translations.${lang}.roleTitle`)} />
                  )}
                </FormField>
                <FormField
                  id={`experience-summary-${lang}`}
                  label={tr.experience.summary}
                  error={errors.translations?.[lang]?.summary?.message}
                >
                  {(field) => (
                    <Textarea
                      {...field}
                      rows={3}
                      {...form.register(`translations.${lang}.summary`)}
                    />
                  )}
                </FormField>
              </>
            )}
          </TranslationTabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={requestClose}>
              {tr.uses.cancel}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {tr.form.save}
            </Button>
          </div>
        </form>

        <ConfirmDialog
          open={confirmingClose}
          title={tr.unsaved.title}
          description={tr.uses.discardDescription}
          cancelLabel={tr.uses.keepEditing}
          confirmLabel={tr.uses.discard}
          destructive
          onCancel={() => {
            setConfirmingClose(false);
          }}
          onConfirm={() => {
            setConfirmingClose(false);
            onClose();
          }}
        />
        <UnsavedChangesGuard isDirty={isDirty} />
      </DialogContent>
    </Dialog>
  );
}
