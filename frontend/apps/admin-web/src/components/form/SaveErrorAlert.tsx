import { Button } from "@/components/ui/button";
import { tr } from "@/i18n/tr";
import { isProblem, PROBLEM_TYPES } from "@/lib/problem";

// Errors stay on the page until the next attempt. Only a version conflict offers a reload: reloading
// can't fix other problems (a taken slug is shown on its field by the form itself).
export function SaveErrorAlert({ error, onReload }: { error: Error | null; onReload: () => void }) {
  if (!error) {
    return null;
  }
  const conflict = isProblem(error, PROBLEM_TYPES.versionConflict);
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-destructive-soft px-4.5 py-3.5 text-[15px] text-destructive"
    >
      <span>{conflict ? tr.form.conflict : tr.form.saveFailed}</span>
      {conflict && (
        <Button variant="destructive" size="sm" onClick={onReload}>
          {tr.form.reload}
        </Button>
      )}
    </div>
  );
}
