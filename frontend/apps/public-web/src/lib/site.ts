// The site's public address, for everything that needs a full URL: OG images, canonical and hreflang links,
// the sitemap and RSS (5d decision 1). Read at run time (pages render on their first visit), so one image
// works on any domain. Missing in production is an error rather than silently spreading localhost links.
const origin = /^https?:\/\/[^/\s]+$/;

export function readSiteUrl(value: string | undefined, environment: string | undefined): URL {
  if (!value) {
    if (environment !== "production") {
      return new URL("http://localhost:3000");
    }
    throw new Error(
      "SITE_URL is not set: OG images, canonical links and the sitemap need the site's full address",
    );
  }
  if (!origin.test(value)) {
    throw new Error(
      `SITE_URL must look like https://example.com (no path, no trailing slash), got "${value}"`,
    );
  }
  return new URL(value);
}

export function siteUrl() {
  return readSiteUrl(process.env.SITE_URL, process.env.NODE_ENV);
}
