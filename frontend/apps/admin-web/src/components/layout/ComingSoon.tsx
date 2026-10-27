import { tr } from "@/i18n/tr";

// Placeholder for sections built in 4b–4e
export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{tr.common.comingSoon}</p>
    </section>
  );
}
