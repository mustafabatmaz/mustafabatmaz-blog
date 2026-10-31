import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { useAnnounce } from "@/components/announcer/useAnnounce";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { tr } from "@/i18n/tr";
import { yearOptions } from "@/features/experience/yearMonth";
import { LANGUAGES } from "@/lib/translations";
import type { ProfileFormValues } from "./profileSchema";

interface EducationFieldProps {
  control: Control<ProfileFormValues>;
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>["education"];
}

// Same list pattern as the social links (useFieldArray, rows keyed by field.id, ↑ ↓ and remove)
export function EducationField({ control, register, errors }: EducationFieldProps) {
  const { fields, append, move, remove } = useFieldArray({ control, name: "education" });
  const entries = useWatch({ control, name: "education" });
  const announce = useAnnounce();
  const years = yearOptions();

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 && <p className="text-muted-foreground">{tr.profile.noEducation}</p>}
      {fields.map((field, index) => {
        const path = `education.${String(index)}` as `education.${number}`;
        const entryErrors = errors?.[index];
        const name = (entries.at(index) ?? field).school || tr.profile.educationEntry(index + 1);
        return (
          <fieldset key={field.id} className="flex flex-col gap-4 rounded-2xl border p-4">
            <legend className="sr-only">{tr.profile.educationEntry(index + 1)}</legend>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
              <FormField
                id={`${field.id}-school`}
                label={tr.profile.school}
                error={entryErrors?.school?.message}
              >
                {(props) => <Input {...props} {...register(`${path}.school`)} />}
              </FormField>
              <FormField
                id={`${field.id}-start`}
                label={tr.profile.startYear}
                error={entryErrors?.startYear?.message}
              >
                {(props) => (
                  <NativeSelect {...props} {...register(`${path}.startYear`)}>
                    <option value="">—</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>
              <FormField
                id={`${field.id}-end`}
                label={tr.profile.endYear}
                error={entryErrors?.endYear?.message}
              >
                {(props) => (
                  <NativeSelect {...props} {...register(`${path}.endYear`)}>
                    <option value="">{tr.profile.ongoing}</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </FormField>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {LANGUAGES.map((lang) => (
                <FormField
                  key={lang}
                  id={`${field.id}-degree-${lang}`}
                  label={tr.profile.degree(lang.toUpperCase())}
                  error={entryErrors?.degree?.[lang]?.message}
                >
                  {(props) => (
                    <Input {...props} lang={lang} {...register(`${path}.degree.${lang}`)} />
                  )}
                </FormField>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={tr.profile.educationMoveUp(name)}
                disabled={index === 0}
                onClick={() => {
                  move(index, index - 1);
                  announce(tr.profile.educationMoved(name, index));
                }}
              >
                <ArrowUpIcon aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={tr.profile.educationMoveDown(name)}
                disabled={index === fields.length - 1}
                onClick={() => {
                  move(index, index + 1);
                  announce(tr.profile.educationMoved(name, index + 2));
                }}
              >
                <ArrowDownIcon aria-hidden="true" />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                aria-label={tr.profile.educationRemove(name)}
                onClick={() => {
                  remove(index);
                  announce(tr.profile.educationRemoved(name));
                }}
              >
                <XIcon aria-hidden="true" />
              </Button>
            </div>
          </fieldset>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        className="self-start border-dashed"
        onClick={() => {
          append({ school: "", startYear: "", endYear: "", degree: { tr: "", en: "" } });
        }}
      >
        <PlusIcon aria-hidden="true" />
        {tr.profile.addEducation}
      </Button>
    </div>
  );
}
