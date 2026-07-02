/**
 * Resolves the parent portal base URL.
 *
 * Priority:
 * 1. Custom portal URL override
 * 2. Path derived from academy website URL (e.g. website.com/parents)
 * 3. Fallback environment variables or current window origin
 */
function ensureProtocol(urlString: string) {
  return /^https?:\/\//i.test(urlString) ? urlString : `https://${urlString}`;
}

function normalizeParentsUrl(urlString: string) {
  const parsed = new URL(ensureProtocol(urlString));

  if (parsed.hostname.startsWith("portal.")) {
    parsed.hostname = parsed.hostname.replace(/^portal\./i, "");
  }

  if (parsed.hostname.startsWith("parents.")) {
    parsed.hostname = parsed.hostname.replace(/^parents\./i, "");
  }

  if (parsed.pathname === "/" || parsed.pathname === "") {
    parsed.pathname = "/parents";
    return parsed.toString().replace(/\/$/, "");
  }

  if (parsed.pathname === "/portal/login" || parsed.pathname === "/parents/login") {
    parsed.pathname = "/parents";
    return parsed.toString().replace(/\/$/, "");
  }

  if (parsed.pathname === "/portal" || parsed.pathname.startsWith("/portal/")) {
    parsed.pathname = parsed.pathname.replace(/^\/portal/, "/parents") || "/parents";
  }

  return parsed.toString().replace(/\/$/, "");
}

export function getPortalBaseUrl(
  customPortalUrl?: string | null,
  academyWebsite?: string | null
): string {
  // 1. Explicitly configured Parent Portal URL has top priority
  if (customPortalUrl && customPortalUrl.trim()) {
    return normalizeParentsUrl(customPortalUrl.trim());
  }

  // 2. Fallback to derived path from Academy Website
  if (academyWebsite && academyWebsite.trim()) {
    const urlString = ensureProtocol(academyWebsite.trim());
    try {
      const parsed = new URL(urlString);
      const port = parsed.port ? `:${parsed.port}` : "";
      return `${parsed.protocol}//${parsed.hostname}${port}/parents`;
    } catch (e) {
      console.error("Failed to parse academy website URL", e);
    }
  }

  // 3. Absolute Fallback: environment variables or browser origin
  const fallbackBase =
    process.env.NEXT_PUBLIC_PORTAL_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window === "undefined" ? "" : window.location.origin);

  if (!fallbackBase) {
    return "";
  }

  return normalizeParentsUrl(fallbackBase);
}
