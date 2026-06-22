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
  } else {
    const parts = host.split(".");
    baseHost = parts.length >= 3 ? parts.slice(1).join(".") : host;
  }

  const nextHost = targetHost === "main" ? baseHost : `${targetHost}.${baseHost}`;
  url.host = port ? `${nextHost}:${port}` : nextHost;
  url.pathname = pathname;
  url.search = "";
  url.hash = "";

  return url;
}
