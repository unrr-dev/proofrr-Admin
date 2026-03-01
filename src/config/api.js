const trimTrailingSlashes = (value = "") => value.replace(/\/+$/, "");
const DEFAULT_BACKEND_ORIGIN = "https://api.proofrr.com";

const isLocalhost = (hostname = "") => hostname === "localhost" || hostname === "127.0.0.1";

const resolveApiBase = () => {
  const envValue = import.meta.env.VITE_API_BASE_URL;
  if (envValue) return envValue;

  if (typeof window !== "undefined" && window.location?.origin) {
    const { origin, hostname } = window.location;
    if (isLocalhost(hostname)) {
      return `${trimTrailingSlashes(origin)}/api`;
    }
  }

  return `${DEFAULT_BACKEND_ORIGIN}/api`;
};

const providedApiBase = resolveApiBase();
const normalizedApiBase = trimTrailingSlashes(providedApiBase);
const hasApiSuffix = normalizedApiBase.endsWith("/api");

export const API_ORIGIN = hasApiSuffix ? normalizedApiBase.slice(0, -4) : normalizedApiBase;
export const API_BASE = hasApiSuffix ? normalizedApiBase : `${API_ORIGIN}/api`;

export const AUTH_API = `${API_BASE}/auth`;
export const ADMIN_DASHBOARD_API = `${API_BASE}/admin/dashboard`;

export const buildApiUrl = (path = "") => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
};
