import { tr } from "@/i18n/tr";
import { ConfirmDialog } from "./ConfirmDialog";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

// Drop into any form page: asks before navigating away while the form has unsaved changes
export function UnsavedChangesGuard({ isDirty }: { isDirty: boolean }) {
  const blocker = useUnsavedChangesGuard(isDirty);
  return (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      title={tr.unsaved.title}
      description={tr.unsaved.description}
      cancelLabel={tr.unsaved.stay}
      confirmLabel={tr.unsaved.leave}
      destructive
      onCancel={() => {
        blocker.reset?.();
      }}
      onConfirm={() => {
        blocker.proceed?.();
      }}
    />
  );
}
