export const decodeJwtPayload = (token = "") => {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  const payload = parts[1];
  if (!payload) return null;

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  try {
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getTokenExpiry = (token = "") => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
};

export const isTokenExpired = (token = "", skewSeconds = 0) => {
  const expMs = getTokenExpiry(token);
  if (!expMs) return false;
  const skewMs = Math.max(0, Number(skewSeconds) || 0) * 1000;
  return Date.now() >= expMs - skewMs;
};
