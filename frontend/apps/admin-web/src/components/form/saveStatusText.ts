import { tr } from "@/i18n/tr";

interface SaveState {
  isDirty: boolean;
  isSaving: boolean;
  savedAt?: Date | undefined;
}

const timeFormat = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

// Derived from form and mutation state on every render; never stored separately
export function saveStatusText({ isDirty, isSaving, savedAt }: SaveState) {
  if (isSaving) {
    return tr.form.saving;
  }
  if (isDirty) {
    return tr.form.unsaved;
  }
  if (savedAt) {
    return tr.form.savedAt(timeFormat.format(savedAt));
  }
  return "";
}
