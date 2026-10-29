import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { useAnnounce } from "@/components/announcer/useAnnounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { tr } from "@/i18n/tr";
import { PLATFORMS, platformLabels, type ProfileFormValues } from "./profileSchema";

interface SocialLinksFieldProps {
  control: Control<ProfileFormValues>;
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>["socialLinks"];
}

// A dynamic list of rows: useFieldArray is React Hook Form's FormArray. Rows are keyed by field.id,
// a stable id per row, so moving a row moves its DOM element and keeps focus on the pressed button.
export function SocialLinksField({ control, register, errors }: SocialLinksFieldProps) {
  const { fields, append, move, remove } = useFieldArray({ control, name: "socialLinks" });
  const links = useWatch({ control, name: "socialLinks" });
  const announce = useAnnounce();

  const unused = PLATFORMS.find((platform) => !links.some((link) => link.platform === platform));

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 && <p className="text-muted-foreground">{tr.profile.noLinks}</p>}
      {fields.map((field, index) => {
        // The watched value follows the select; field holds the value the row was created with
        const label = platformLabels[(links.at(index) ?? field).platform];
        const urlError = errors?.[index]?.url?.message;
        return (
          <div key={field.id} className="flex flex-wrap items-start gap-2">
            <NativeSelect
              aria-label={tr.profile.platform}
              className="flex-[0_0_170px]"
              {...register(
                `socialLinks.${String(index)}.platform` as `socialLinks.${number}.platform`,
              )}
            >
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platformLabels[platform]}
                </option>
              ))}
            </NativeSelect>
            <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
              <Input
                type="url"
                aria-label={tr.profile.url}
                className="font-mono text-[13px]"
                aria-invalid={urlError ? true : undefined}
                aria-describedby={urlError ? `${field.id}-url-error` : undefined}
                {...register(`socialLinks.${String(index)}.url` as `socialLinks.${number}.url`)}
              />
              {urlError && (
                <p id={`${field.id}-url-error`} className="text-sm text-destructive">
                  {urlError}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={tr.profile.moveUp(label)}
              disabled={index === 0}
              onClick={() => {
                move(index, index - 1);
                announce(tr.profile.moved(label, index));
              }}
            >
              <ArrowUpIcon aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={tr.profile.moveDown(label)}
              disabled={index === fields.length - 1}
              onClick={() => {
                move(index, index + 1);
                announce(tr.profile.moved(label, index + 2));
              }}
            >
              <ArrowDownIcon aria-hidden="true" />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              aria-label={tr.profile.remove(label)}
              onClick={() => {
                remove(index);
                announce(tr.profile.removed(label));
              }}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        className="self-start border-dashed"
        onClick={() => {
          append({ platform: unused ?? "LINKEDIN", url: "" });
        }}
      >
        <PlusIcon aria-hidden="true" />
        {tr.profile.addLink}
      </Button>
    </div>
  );
}
