function networkSafeApiRoot(configuredRoot) {
  const root = String(configuredRoot || "/api").replace(/\/+$/, "");

  try {
    const url = new URL(root);
    const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    const pageIsRemote = !["localhost", "127.0.0.1", "::1"].includes(
      window.location.hostname
    );

    if (isLoopback && pageIsRemote) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    // Relative API roots intentionally use the host that served the page.
  }

  return root;
}

const fallbackApiRoot = networkSafeApiRoot(
  import.meta.env.VITE_API_ROOT || "/api"
);

export const API_ROOT = window.ispDesktop?.apiRoot || fallbackApiRoot;

export const API_ORIGIN = API_ROOT.endsWith("/api")
  ? API_ROOT.slice(0, -4) || window.location.origin
  : window.location.origin;

export function apiUrl(path = "") {
  const cleanPath = String(path).replace(/^\/+/, "");
  return cleanPath ? `${API_ROOT}/${cleanPath}` : API_ROOT;
}
