import { useId, type ReactNode } from "react";

// A titled card that groups related fields; the title labels the region for screen readers
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-5 rounded-2xl border bg-card p-6"
    >
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}
