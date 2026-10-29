import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";

// Based on shadcn's base-nova dialog, written by hand on Base UI (the CLI would overwrite button.tsx).
// Base UI provides the focus trap, initial focus, focus return, Escape and the inert background.
function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/40 duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-[10vh] left-1/2 z-50 max-h-[80vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-y-auto rounded-2xl border bg-popover p-7 text-popover-foreground outline-none data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[22px] font-bold tracking-tight", className)}
      {...props}
    />
  );
}

export { Dialog, DialogContent, DialogTitle };
