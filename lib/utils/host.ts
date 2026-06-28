export type AppHost = "main" | "admin" | "portal";

function stripPort(hostname: string) {
  const [host, port] = hostname.split(":");
  return { host, port: port ?? "" };
}

export function getAppHost(hostname: string): AppHost {
  const { host } = stripPort(hostname);

  // Handle localhost subdomains (admin.localhost, portal.localhost)
  if (host === "localhost" || host.endsWith(".localhost")) {
    const parts = host.split(".");
    return parts.length > 1 ? (parts[0] as AppHost) : "main";
  }

  // Handle Vercel subdomains (admin.project-name.vercel.app)
  if (host.endsWith(".vercel.app")) {
    const parts = host.split(".");
    // If we have more than 3 parts (e.g., admin.tagadmin-chi.vercel.app), first part is subdomain
    if (parts.length >= 4) {
      const subdomain = parts[0];
      if (subdomain === "admin" || subdomain === "portal") {
        return subdomain as AppHost;
      }
    }
    return "main";
  }

  // Handle custom domains (admin.yourdomain.com)
  const parts = host.split(".");
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain === "admin" || subdomain === "portal") {
      return subdomain as AppHost;
    }
  }

  return "main";
}

export function buildAppUrl(
  requestUrl: URL,
  hostname: string,
  targetHost: AppHost,
  pathname: string
) {
  const { host, port } = stripPort(hostname);
  const url = new URL(requestUrl.toString());

  let baseHost = host;
  
  // Handle localhost
  if (host === "localhost" || host.endsWith(".localhost")) {
    baseHost = "localhost";
  } 
  // Handle Vercel domains
  else if (host.endsWith(".vercel.app")) {
    const parts = host.split(".");
    // Extract base domain (e.g., tagadmin-chi.vercel.app from admin.tagadmin-chi.vercel.app)
    baseHost = parts.slice(-3).join(".");
  } 
  // Handle custom domains
  else {
    const parts = host.split(".");
    // If we have admin.yourdomain.com, extract yourdomain.com
    baseHost = parts.length >= 3 ? parts.slice(1).join(".") : host;
  }

  const nextHost = targetHost === "main" ? baseHost : `${targetHost}.${baseHost}`;
  url.hostname = nextHost;
  url.port = port;
  url.pathname = pathname;
  url.search = requestUrl.search;
  url.hash = "";

  return url;
}
