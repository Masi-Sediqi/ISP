const fallbackApiRoot = import.meta.env.VITE_API_ROOT || "/api";

export const API_ROOT = window.ispDesktop?.apiRoot || fallbackApiRoot;

export function apiUrl(path = "") {
  const cleanPath = String(path).replace(/^\/+/, "");
  return cleanPath ? `${API_ROOT}/${cleanPath}` : API_ROOT;
}
