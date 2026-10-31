import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Chip } from "@/components/content/Chip";
import { pillOutline, pillPrimary } from "@/components/layout/pill";
import { EmailLink } from "@/features/contact/EmailLink";
import { yearOf, yearRange } from "@/features/experience/years";
import { topSkills } from "@/features/home/skills";
import { nowSummary } from "@/features/now/nowSummary";
import { Link } from "@/i18n/navigation";
import { getExperience, getLatestPosts, getPage, getProfile } from "@/lib/content";
import { encodeEmail } from "@/lib/email";
import { pageAlternates, pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const [profile, t] = await Promise.all([getProfile(locale), getTranslations("site")]);
  const name = t("name");
  const metadata = pageMetadata({
    locale,
    title: name,
    description: profile
      ? [profile.headline, profile.intro].filter(Boolean).join(". ")
      : t("defaultDescription"),
    alternates: pageAlternates("/", locale),
    siteName: name,
  });
  // "Mustafa Batmaz · Senior Software Developer", not the layout's "%s · Mustafa Batmaz"
  return { ...metadata, title: { absolute: profile ? `${name} · ${profile.headline}` : name } };
}

// Server Component: all data is fetched here, on the server, in parallel; only EmailLink runs in the browser
export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const [profile, now, experience, posts] = await Promise.all([
    getProfile(locale),
    getPage("NOW", locale),
    getExperience(locale),
    getLatestPosts(locale),
  ]);

  // The name is content from the profile; without one the site name stands in (5b decision 7)
  const names = (profile?.fullName ?? t("site.name")).split(/\s+/);
  const summary = now ? nowSummary(now.bodyMd) : null;
  const skills = topSkills(experience);
  const links = profile?.socialLinks ?? [];

  return (
    <div className="flex flex-col gap-22">
      <section className="flex flex-wrap items-end gap-10">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-6">
          <h1 className="text-[64px] leading-[0.92] font-bold tracking-tighter break-words sm:text-[104px]">
            {names.map((name, index) => (
              <span key={index} className="block">
                {name}
                {index === names.length - 1 && <span className="text-link">.</span>}
              </span>
            ))}
          </h1>
          {profile && (
            <p
              lang={profile.lang}
              className="max-w-140 text-[19px] leading-relaxed text-muted-foreground"
            >
              <span className="font-medium text-foreground">{profile.headline}</span>
              {profile.intro && <> {profile.intro}</>}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            {links.map((link, index) => (
              <a key={link.url} href={link.url} className={index === 0 ? pillPrimary : pillOutline}>
                {t(`platforms.${link.platform}`)}
              </a>
            ))}
            {profile?.email && (
              <EmailLink
                encoded={encodeEmail(profile.email)}
                label={t("home.email")}
                className={links.length === 0 ? pillPrimary : pillOutline}
              />
            )}
          </div>
        </div>
        {now && summary && (
          <aside className="flex flex-[1_1_300px] flex-col gap-3.5 rounded-3xl bg-secondary p-7">
            <Link
              href="/now"
              className="font-mono text-[13px] text-secondary-foreground no-underline"
            >
              {t("home.now")}
            </Link>
            <p lang={now.lang} className="text-lg leading-normal font-medium">
              {summary}
            </p>
            {profile?.location && (
              <span className="font-mono text-xs text-muted-foreground">{profile.location}</span>
            )}
          </aside>
        )}
      </section>

      {skills.length > 0 && (
        <section aria-label={t("home.skills")} className="flex flex-wrap gap-2.5">
          {skills.map((skill) => (
            <Chip key={skill} size="md">
              {skill}
            </Chip>
          ))}
        </section>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-14">
        {posts.length > 0 && (
          <section className="flex flex-col gap-1">
            <h2 className="mb-3 text-[28px] font-bold tracking-tight">{t("home.writing")}</h2>
            {posts.map((post, index) => (
              <Link
                key={post.slug}
                href={`/writing/${post.slug}`}
                className="flex gap-5 border-t py-4.5 text-foreground no-underline"
              >
                <span className="pt-0.5 font-mono text-[13px] text-link">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-lg leading-snug font-medium">{post.title}</span>
              </Link>
            ))}
          </section>
        )}
        {experience.length > 0 && (
          <section className="flex flex-col gap-1">
            <h2 className="mb-3 text-[28px] font-bold tracking-tight">
              <Link href="/experience" className="text-foreground no-underline">
                {t("home.experience")}
              </Link>
            </h2>
            {experience.slice(0, 3).map((job) => (
              <div
                key={`${job.company}-${job.startMonth}`}
                className="flex justify-between gap-4 border-t py-4.5"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold">{job.company}</span>
                  <span lang={job.lang} className="text-[15px] text-muted-foreground">
                    {job.roleTitle}
                  </span>
                </div>
                <span className="font-mono text-[13px] whitespace-nowrap text-muted-foreground">
                  {yearRange(yearOf(job.startMonth) ?? 0, yearOf(job.endMonth), t("dates.present"))}
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
