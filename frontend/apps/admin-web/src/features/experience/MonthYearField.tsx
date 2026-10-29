import type { UseFormRegister } from "react-hook-form";
import { NativeSelect } from "@/components/ui/native-select";
import { tr } from "@/i18n/tr";
import type { ExperienceFormValues } from "./experienceSchema";
import { MONTHS, yearOptions } from "./yearMonth";

interface MonthYearFieldProps {
  name: "start" | "end";
  legend: string;
  register: UseFormRegister<ExperienceFormValues>;
  error?: string | undefined;
  disabled?: boolean | undefined;
}

// Two native selects grouped by a fieldset, so a screen reader announces them together ("Başlangıç ayı")
export function MonthYearField({ name, legend, register, error, disabled }: MonthYearFieldProps) {
  const errorId = error ? `${name}-error` : undefined;
  const aria = {
    ...(error ? { "aria-invalid": true as const, "aria-describedby": errorId } : {}),
  };
  return (
    <fieldset className="flex min-w-0 flex-col gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-semibold">{legend}</legend>
      <div className="flex gap-2">
        <NativeSelect
          aria-label={`${legend} ayı`}
          className="min-w-0 flex-1 disabled:opacity-50"
          {...aria}
          {...register(`${name}.month`)}
        >
          <option value="">{tr.experience.monthPlaceholder}</option>
          {MONTHS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={`${legend} yılı`}
          className="w-24 font-mono text-sm disabled:opacity-50"
          {...aria}
          {...register(`${name}.year`)}
        >
          <option value="">{tr.experience.yearPlaceholder}</option>
          {yearOptions().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </NativeSelect>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
