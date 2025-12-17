// Centralized API base helper.
// If VITE_API_BASE_URL is set (e.g. https://api.example.com), requests will go cross-origin.
// If not set, requests will stay relative (e.g. /api/...) and you can proxy /api on the frontend host.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function apiUrl(path) {
  if (!API_BASE_URL) return path;
  if (!path) return API_BASE_URL;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}
