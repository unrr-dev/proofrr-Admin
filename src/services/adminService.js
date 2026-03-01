import { apiRequest } from "./apiClient.js";

const MAX_WINDOW_DAYS = 3650;
const MAX_LIMIT = 500;

const clampInt = (value, fallback, min, max) => {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
};

export const normalizeDashboardQuery = (query = {}) => ({
  activeDays: clampInt(query.activeDays, 30, 1, MAX_WINDOW_DAYS),
  limit: clampInt(query.limit, 50, 1, MAX_LIMIT),
  offset: clampInt(query.offset, 0, 0, Number.MAX_SAFE_INTEGER),
});

export const normalizeLoginActivityQuery = (query = {}) => ({
  days: clampInt(query.days, 30, 1, MAX_WINDOW_DAYS),
  limit: clampInt(query.limit, 50, 1, MAX_LIMIT),
});

export const fetchDashboard = async ({ token, activeDays, limit, offset } = {}) => {
  const params = normalizeDashboardQuery({ activeDays, limit, offset });

  return apiRequest("/admin/dashboard", {
    token,
    params,
  });
};

export const fetchLoginActivity = async ({ token, days, limit } = {}) => {
  const params = normalizeLoginActivityQuery({ days, limit });

  return apiRequest("/admin/dashboard/login-activity", {
    token,
    params,
  });
};
