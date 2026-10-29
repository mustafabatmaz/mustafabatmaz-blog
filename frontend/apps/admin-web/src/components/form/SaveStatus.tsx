import { cn } from "cn";
import { saveStatusText } from "./saveStatusText";

export function SaveStatus(props: {
  isDirty: boolean;
  isSaving: boolean;
  savedAt?: Date | undefined;
}) {
  const saved = !props.isDirty && !props.isSaving && props.savedAt;
  return (
    <span
      role="status"
      className={cn("font-mono text-xs", saved ? "text-mint-foreground" : "text-muted-foreground")}
    >
      {saveStatusText(props)}
    </span>
  );
}
