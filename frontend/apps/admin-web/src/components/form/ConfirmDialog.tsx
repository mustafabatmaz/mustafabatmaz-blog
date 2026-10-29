import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Controlled from outside: the caller decides when it opens and what each answer does
export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          props.onCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>{props.title}</AlertDialogTitle>
        <AlertDialogDescription>{props.description}</AlertDialogDescription>
        <AlertDialogFooter>
          <Button variant="outline" onClick={props.onCancel}>
            {props.cancelLabel}
          </Button>
          <Button variant={props.destructive ? "destructive" : "default"} onClick={props.onConfirm}>
            {props.confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
