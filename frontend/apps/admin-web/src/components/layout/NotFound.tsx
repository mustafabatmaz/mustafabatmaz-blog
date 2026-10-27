import { Link } from "react-router";
import { tr } from "@/i18n/tr";

export function NotFound() {
  return (
    <section className="flex flex-col gap-3">
      <span className="font-mono text-sm text-muted-foreground">404</span>
      <h1 className="text-4xl font-bold tracking-tight">{tr.notFound.title}</h1>
      <Link to="/posts" className="text-link underline-offset-4 hover:underline">
        {tr.notFound.back}
      </Link>
    </section>
  );
}
