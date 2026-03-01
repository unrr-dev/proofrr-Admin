import { apiRequest } from "./apiClient.js";

export const ADMIN_AUTH_STORAGE_KEY = "proofrr_admin_auth";

export const hasAdminAccess = (user = {}) => {
  const accessRoleValue = user?.accessRole ?? "";
  return String(accessRoleValue).toLowerCase() === "admin";
};

export const toSession = (payload = {}) => {
  const token = typeof payload?.token === "string" ? payload.token : null;
  const googleToken = typeof payload?.googleToken === "string" ? payload.googleToken : null;
  const user = payload?.user && typeof payload.user === "object" ? payload.user : null;

  if (!token) return null;

  return {
    token,
    googleToken,
    user,
  };
};

export const persistSession = (session) => {
  if (!session?.token) return;

  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem("authToken", session.token);

  if (session.googleToken) {
    localStorage.setItem("googleToken", session.googleToken);
  } else {
    localStorage.removeItem("googleToken");
  }

  if (session.user && typeof session.user === "object") {
    localStorage.setItem("user", JSON.stringify(session.user));
  } else {
    localStorage.removeItem("user");
  }
};

export const restoreSession = () => {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (typeof parsed.token !== "string" || !parsed.token) return null;

    return {
      token: parsed.token,
      googleToken: typeof parsed.googleToken === "string" ? parsed.googleToken : null,
      user: parsed.user && typeof parsed.user === "object" ? parsed.user : null,
    };
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  localStorage.removeItem("authToken");
  localStorage.removeItem("googleToken");
  localStorage.removeItem("user");
};

export const loginWithPassword = async ({ identifier, password }) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: {
      identifier,
      password,
    },
  });
};

export const loginWithGoogle = async ({ idToken }) => {
  return apiRequest("/auth/google", {
    method: "POST",
    body: {
      idToken,
    },
  });
};
