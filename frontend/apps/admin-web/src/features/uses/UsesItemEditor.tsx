import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ConfirmDialog } from "@/components/form/ConfirmDialog";
import { FormField } from "@/components/form/FormField";
import { SaveErrorAlert } from "@/components/form/SaveErrorAlert";
import { TranslationTabs } from "@/components/form/TranslationTabs";
import { UnsavedChangesGuard } from "@/components/form/UnsavedChangesGuard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { tr } from "@/i18n/tr";
import { firstLanguageWithErrors, type Language } from "@/lib/translations";
import {
  CATEGORIES,
  categoryLabels,
  fromUsesItem,
  toUsesRequest,
  usesItemSchema,
  type UsesItem,
} from "./usesSchema";
import { useSaveUsesItem, useUsesItems } from "./useUses";

interface UsesItemEditorProps {
  item: UsesItem | null;
  onClose: () => void;
  onSaved: (saved: UsesItem) => void;
}

// Mounted while editing, unmounted on close: every opening starts from a fresh form.
// The form lives in the dialog, so closing can first check for unsaved changes.
export function UsesItemEditor({ item, onClose, onSaved }: UsesItemEditorProps) {
  const { refetch } = useUsesItems();
  const save = useSaveUsesItem();
  const [language, setLanguage] = useState<Language>("tr");
  const [confirmingClose, setConfirmingClose] = useState(false);
  const form = useForm({
    resolver: zodResolver(usesItemSchema),
    defaultValues: fromUsesItem(item),
  });
  const { errors, isDirty } = form.formState;

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
        { id: item?.id, body: toUsesRequest(values, item?.version) },
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
      const fresh = data?.find((candidate) => candidate.id === item?.id);
      if (fresh) {
        form.reset(fromUsesItem(fresh));
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
      <DialogContent>
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>{item ? tr.uses.editItem : tr.uses.newItem}</DialogTitle>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="uses-category" label={tr.uses.category}>
              {(field) => (
                <NativeSelect {...field} {...form.register("category")}>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </FormField>
            <FormField
              id="uses-url"
              label={tr.uses.url}
              hint={tr.uses.urlHint}
              error={errors.url?.message}
            >
              {(field) => (
                <Input
                  {...field}
                  type="url"
                  className="font-mono text-[13px]"
                  {...form.register("url")}
                />
              )}
            </FormField>
          </div>

          <TranslationTabs
            value={language}
            onValueChange={setLanguage}
            errors={errors.translations}
          >
            {(lang) => (
              <>
                <FormField
                  id={`uses-name-${lang}`}
                  label={tr.uses.name}
                  error={errors.translations?.[lang]?.name?.message}
                >
                  {(field) => <Input {...field} {...form.register(`translations.${lang}.name`)} />}
                </FormField>
                <FormField
                  id={`uses-description-${lang}`}
                  label={tr.uses.description}
                  error={errors.translations?.[lang]?.description?.message}
                >
                  {(field) => (
                    <Textarea
                      {...field}
                      rows={3}
                      {...form.register(`translations.${lang}.description`)}
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

        {/* Nested inside the dialog so Base UI treats it as a child, not as an outside element */}
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
