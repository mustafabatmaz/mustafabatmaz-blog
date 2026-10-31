// Sent with every response through next.config's headers() (5e decision 1). The CSP has no nonce so pages stay
// static with ISR (5a decision 5): the only inline script is the fixed theme script, and markdown is rendered
// without raw HTML and sanitized. React needs eval in development only (Next's CSP guide).
// HSTS and upgrade-insecure-requests need https and come with the deploy's reverse proxy (Phase 7).
export function securityHeaders(isDev: boolean): { key: string; value: string }[] {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Outgoing links (LinkedIn, GitHub) see the site's origin, never the page path
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
}
