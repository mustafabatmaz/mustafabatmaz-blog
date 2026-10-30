import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useAnnounce } from "@/components/announcer/useAnnounce";
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
import { formatDateTime } from "@/lib/format";
import { isProblem, PROBLEM_TYPES } from "@/lib/problem";
import type { Language } from "@/lib/translations";
import { formatBytes } from "./mediaFiles";
import { fromMedia, mediaName, mediaSchema, toMediaRequest, type MediaItem } from "./mediaSchema";
import { useDeleteMedia, useMediaItems, useSaveMedia } from "./useMedia";

const MAX_ALT_TEXT = 300;

interface MediaEditorProps {
  item: MediaItem;
  onClose: () => void;
}

// Uses-editor pattern: mounted while open, so every opening starts from a fresh form
export function MediaEditor({ item, onClose }: MediaEditorProps) {
  const { refetch } = useMediaItems();
  const save = useSaveMedia();
  const remove = useDeleteMedia();
  const announce = useAnnounce();
  const [language, setLanguage] = useState<Language>("tr");
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const form = useForm({ resolver: zodResolver(mediaSchema), defaultValues: fromMedia(item) });
  const { errors, isDirty } = form.formState;
  const translations = useWatch({ control: form.control, name: "translations" });
  const name = mediaName(item);

  const requestClose = () => {
    if (isDirty) {
      setConfirmingClose(true);
    } else {
      onClose();
    }
  };

  const submit = form.handleSubmit((values) => {
    if (item.id === undefined) {
      return;
    }
    save.mutate(
      { id: item.id, body: toMediaRequest(values, item.version) },
      {
        onSuccess: () => {
          announce(tr.media.saved(name));
          onClose();
        },
      },
    );
  });

  const reload = () => {
    void refetch().then(({ data }) => {
      const fresh = data?.find((candidate) => candidate.id === item.id);
      if (fresh) {
        form.reset(fromMedia(fresh));
        save.reset();
      }
    });
  };

  const deleteImage = () => {
    setConfirmingDelete(false);
    if (item.id === undefined) {
      return;
    }
    remove.mutate(item.id, {
      onSuccess: () => {
        announce(tr.media.removed(name));
        onClose();
      },
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
      <DialogContent className="max-w-3xl">
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>{tr.media.editTitle}</DialogTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={tr.media.close}
              onClick={requestClose}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
          <SaveErrorAlert error={save.error} onReload={reload} />
          {remove.isError && (
            <p
              role="alert"
              className="rounded-2xl bg-destructive-soft px-4.5 py-3.5 text-destructive"
            >
              {isProblem(remove.error, PROBLEM_TYPES.mediaInUse)
                ? tr.media.inUse
                : tr.media.deleteFailed}
            </p>
          )}

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3.5">
              <img
                src={item.url}
                alt={tr.media.previewOf(name)}
                className="aspect-4/3 w-full rounded-2xl bg-accent object-contain"
              />
              <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">{tr.media.file}</dt>
                <dd className="font-mono text-[13px] break-all">{name}</dd>
                <dt className="text-muted-foreground">{tr.media.typeAndSize}</dt>
                <dd className="font-mono text-[13px]">
                  {item.format} · {formatBytes(item.sizeBytes ?? 0)}
                </dd>
                {item.createdAt && (
                  <>
                    <dt className="text-muted-foreground">{tr.media.uploadedAt}</dt>
                    <dd className="font-mono text-[13px]">{formatDateTime(item.createdAt)}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">{tr.media.metadata}</dt>
                <dd className={item.metadataStripped ? "text-mint-foreground" : "text-destructive"}>
                  {item.metadataStripped ? tr.media.metadataStripped : tr.media.metadataNotStripped}
                </dd>
              </dl>
              {item.metadataStripped === false && (
                <p className="rounded-2xl border border-destructive-border bg-destructive-soft px-3.5 py-3 text-sm text-destructive">
                  {tr.media.avifWarning}
                </p>
              )}
              <FormField id="media-url" label={tr.media.address}>
                {(field) => (
                  <div className="flex gap-2">
                    <Input
                      {...field}
                      readOnly
                      value={item.url ?? ""}
                      className="min-w-0 flex-1 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(item.url ?? "").then(() => {
                          announce(tr.media.copied);
                        });
                      }}
                    >
                      {tr.media.copy}
                    </Button>
                  </div>
                )}
              </FormField>
            </div>

            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
              <TranslationTabs
                value={language}
                onValueChange={setLanguage}
                errors={errors.translations}
              >
                {(lang) => (
                  <FormField
                    id={`media-alt-${lang}`}
                    label={tr.media.altText}
                    hint={`${tr.media.altTextHint} ${tr.form.counter(translations[lang].altText.length, MAX_ALT_TEXT)}`}
                    error={errors.translations?.[lang]?.altText?.message}
                  >
                    {(field) => (
                      <Textarea
                        {...field}
                        rows={4}
                        {...form.register(`translations.${lang}.altText`)}
                      />
                    )}
                  </FormField>
                )}
              </TranslationTabs>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                setConfirmingDelete(true);
              }}
            >
              {tr.media.remove}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={requestClose}>
                {tr.media.cancel}
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {tr.form.save}
              </Button>
            </div>
          </div>
        </form>

        {/* Nested inside the dialog so Base UI treats them as children, not as outside elements */}
        <ConfirmDialog
          open={confirmingClose}
          title={tr.unsaved.title}
          description={tr.media.discardDescription}
          cancelLabel={tr.media.keepEditing}
          confirmLabel={tr.media.discard}
          destructive
          onCancel={() => {
            setConfirmingClose(false);
          }}
          onConfirm={() => {
            setConfirmingClose(false);
            onClose();
          }}
        />
        <ConfirmDialog
          open={confirmingDelete}
          title={tr.media.remove}
          description={tr.media.deleteDescription(name)}
          cancelLabel={tr.media.cancel}
          confirmLabel={tr.media.removeConfirm}
          destructive
          onCancel={() => {
            setConfirmingDelete(false);
          }}
          onConfirm={deleteImage}
        />
        <UnsavedChangesGuard isDirty={isDirty} />
      </DialogContent>
    </Dialog>
  );
}
