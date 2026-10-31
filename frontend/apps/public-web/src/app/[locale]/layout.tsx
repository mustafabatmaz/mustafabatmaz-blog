import type { Metadata } from "next";
import { cn } from "cn";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { themeScript } from "@/features/theme/theme";
import { ThemeSync } from "@/features/theme/ThemeSync";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { spaceGrotesk, spaceMono } from "../fonts";
import "../globals.css";

// Pages are rendered on their first visit, then served as HTML and rebuilt in the background at most once
// a minute (ISR). Nothing is prerendered at build time, so the build doesn't need the backend (5a decision 6).
export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

// Defaults for every page: the base for relative URLs (SITE_URL, 5d decision 1) and the title pattern
// "Page · Mustafa Batmaz" (decision 5). Pages add their own title, description and links.
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    metadataBase: siteUrl(),
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("defaultDescription"),
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    // suppressHydrationWarning: the theme script adds .dark before React takes over, which the server can't know
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(spaceGrotesk.variable, spaceMono.variable)}
    >
      <head>
        {/* A constant string, no visitor data: React would escape it as children, which breaks the script */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeSync />
        {/* Only error.tsx renders text in the browser; everything else is translated on the server */}
        <NextIntlClientProvider messages={{ error: messages.error }}>
          <div className="mx-auto flex min-h-screen max-w-280 flex-col gap-18 px-6 pt-8 pb-14">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
