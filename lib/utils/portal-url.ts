/**
 * Resolves the parent portal base URL.
 * 
 * Priority:
 * 1. Custom portal URL override
 * 2. Subdomain derived from academy website URL (e.g. portal.website.com)
 * 3. Fallback environment variables or current window origin
 */
export function getPortalBaseUrl(
  customPortalUrl?: string | null,
  academyWebsite?: string | null
): string {
  // 1. Explicitly configured Parent Portal URL has top priority
  if (customPortalUrl && customPortalUrl.trim()) {
    let urlString = customPortalUrl.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = "https://" + urlString;
    }
    return urlString;
  }

  // 2. Fallback to derived subdomain of Academy Website
  if (academyWebsite && academyWebsite.trim()) {
    let urlString = academyWebsite.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = "https://" + urlString;
    }
    try {
      const parsed = new URL(urlString);
      let hostname = parsed.hostname;
      if (hostname.startsWith("www.")) {
        hostname = hostname.replace(/^www\./i, "www.portal.");
      } else {
        hostname = "portal." + hostname;
      }
      const port = parsed.port ? `:${parsed.port}` : "";
      return `${parsed.protocol}//${hostname}${port}`;
    } catch (e) {
      console.error("Failed to parse academy website URL", e);
    }
  }

  // 3. Absolute Fallback: environment variables or browser origin
  const fallbackBase = process.env.NEXT_PUBLIC_PORTAL_URL || 
                       process.env.NEXT_PUBLIC_APP_URL || 
                       (typeof window === "undefined" ? "" : window.location.origin);
  return fallbackBase;
}
