const API_BASE_URL = (
  import.meta.env.DEV ? import.meta.env["VITE_API_URL"]?.trim() || "" : ""
).replace(/\/+$/, "");

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });
}
