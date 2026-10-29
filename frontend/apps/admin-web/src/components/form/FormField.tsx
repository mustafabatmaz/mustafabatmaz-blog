import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

// The label also gets an id (`${id}-label`) for fields that are not labelable elements, like the markdown editor
export interface FieldProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  // Render prop: the field gets the id and aria attributes that tie it to its label, hint and error
  children: (field: FieldProps) => ReactNode;
}

export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
      </Label>
      {children({
        id,
        ...(error ? { "aria-invalid": true } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      })}
      {hint && (
        <p id={hintId} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
