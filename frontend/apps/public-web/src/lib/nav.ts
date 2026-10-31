// A menu item stays highlighted on the pages under it: /writing/some-post belongs to "Writing"
export function isCurrentSection(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
