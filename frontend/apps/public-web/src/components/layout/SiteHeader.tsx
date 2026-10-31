import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/features/language/LanguageSwitcher";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { Link } from "@/i18n/navigation";
import { Monogram } from "./Monogram";
import { NavLinks, type NavItem } from "./NavLinks";

// Server Component: renders to HTML and ships no JavaScript of its own; only the three small Client
// Components inside it (menu highlight, language, theme) run in the browser.
export async function SiteHeader() {
  const t = await getTranslations();
  const items: NavItem[] = [
    { href: "/writing", label: t("nav.writing") },
    { href: "/experience", label: t("nav.experience") },
    { href: "/about", label: t("nav.about") },
    { href: "/now", label: t("nav.now") },
    { href: "/uses", label: t("nav.uses") },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-5">
      <Link
        href="/"
        aria-label={t("nav.home")}
        className="flex items-center gap-3 text-foreground no-underline"
      >
        <Monogram />
        <span className="text-[17px] font-semibold tracking-tight">{t("site.name")}</span>
      </Link>
      <nav
        aria-label={t("nav.label")}
        className="flex flex-wrap items-center gap-1.5 text-[15px] font-medium"
      >
        <NavLinks items={items} />
        <LanguageSwitcher
          label={t("language.label")}
          names={{ tr: t("language.tr"), en: t("language.en") }}
        />
        <ThemeToggle label={t("theme.toggle")} />
      </nav>
    </header>
  );
}
