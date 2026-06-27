export type AppHost = "main" | "admin" | "portal";

function stripPort(hostname: string) {
  const [host, port] = hostname.split(":");
  return { host, port: port ?? "" };
}

export function getAppHost(hostname: string): AppHost {
  const { host } = stripPort(hostname);

  if (host === "localhost" || host.endsWith(".localhost")) {
    const parts = host.split(".");
    return parts.length > 1 ? (parts[0] as AppHost) : "main";
  }

  if (host.endsWith(".vercel.app")) {
    const parts = host.split(".");
    if (parts.length > 3) {
      return parts[0] as AppHost;
    }
    return "main";
  }

  const parts = host.split(".");
  return parts.length >= 3 ? (parts[0] as AppHost) : "main";
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
  if (host === "localhost" || host.endsWith(".localhost")) {
    baseHost = "localhost";
  } else if (host.endsWith(".vercel.app")) {
    const parts = host.split(".");
    baseHost = parts.slice(-3).join(".");
  } else {
    const parts = host.split(".");
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
