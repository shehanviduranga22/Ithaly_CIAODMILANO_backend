const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV
    ? ""
    : "https://ithaly-ciaodmilano-backend-ehee.vercel.app")
).replace(/\/+$/, "");

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });
}
