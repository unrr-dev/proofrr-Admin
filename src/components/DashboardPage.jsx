import { useEffect, useState } from "react";
import { BarChartCard, DonutChartCard } from "./Charts.jsx";
import { ApiError } from "../services/apiClient.js";
import { fetchDashboard, normalizeDashboardQuery } from "../services/adminService.js";
import { toSeriesFromObject } from "../utils/chartSeries.js";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return numberFormatter.format(parsed);
};

const formatBytes = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  if (parsed === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(parsed) / Math.log(1024)), units.length - 1);
  const normalized = parsed / 1024 ** index;
  return `${normalized.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const formatDateTime = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function DashboardPage({ token, onUnauthorized }) {
  const [formValues, setFormValues] = useState({
    activeDays: "30",
    limit: "25",
    offset: "0",
  });
  const [query, setQuery] = useState(() =>
    normalizeDashboardQuery({
      activeDays: 30,
      limit: 25,
      offset: 0,
    })
  );

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchDashboard({ token, ...query });
        if (cancelled) return;

        setData(response);
        setFormValues({
          activeDays: String(response?.activeWindowDays ?? query.activeDays),
          limit: String(response?.limit ?? query.limit),
          offset: String(response?.offset ?? query.offset),
        });
      } catch (requestError) {
        if (cancelled) return;

        if (requestError instanceof ApiError && requestError.status === 401) {
          onUnauthorized("Session expired or token is invalid. Please log in again.");
          return;
        }

        if (requestError instanceof ApiError && requestError.status === 403) {
          setError("Forbidden (403): This account does not have admin access.");
          return;
        }

        setError(requestError?.message || "Failed to load dashboard data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [query, token, onUnauthorized]);

  const summary = data?.summary || {};
  const users = Array.isArray(data?.users) ? data.users : [];
  const planSeries = toSeriesFromObject(summary.planDistribution);
  const authSeries = toSeriesFromObject(summary.authProviderDistribution);
  const subscriptionStatusSeries = toSeriesFromObject(summary.subscriptionStatusDistribution);

  const contentSeries = [
    { label: "Projects", value: toSafeNumber(summary.totalProjects), color: "#0c6ce8" },
    { label: "Briefs", value: toSafeNumber(summary.totalBriefs), color: "#08a88a" },
    { label: "Documents", value: toSafeNumber(summary.totalDocuments), color: "#ff9f1c" },
  ];

  const userStateSeries = [
    { label: "Total Users", value: toSafeNumber(summary.totalUsers), color: "#0c6ce8" },
    { label: "Verified", value: toSafeNumber(summary.verifiedUsers), color: "#08a88a" },
    {
      label: "Onboarding Complete",
      value: toSafeNumber(summary.onboardingCompletedUsers),
      color: "#7c3aed",
    },
    { label: "Active", value: toSafeNumber(summary.activeUsers), color: "#ef476f" },
  ];

  const summaryCards = [
    { label: "Total Users", value: formatNumber(summary.totalUsers) },
    { label: "Verified Users", value: formatNumber(summary.verifiedUsers) },
    {
      label: "Onboarding Complete",
      value: formatNumber(summary.onboardingCompletedUsers),
    },
    { label: "Active Users", value: formatNumber(summary.activeUsers) },
    { label: "Paid Users", value: formatNumber(summary.paidUsers) },
    { label: "Free Users", value: formatNumber(summary.freeUsers) },
    { label: "Recent Signups", value: formatNumber(summary.recentSignups) },
    { label: "Total Projects", value: formatNumber(summary.totalProjects) },
    { label: "Total Briefs", value: formatNumber(summary.totalBriefs) },
    { label: "Total Documents", value: formatNumber(summary.totalDocuments) },
    { label: "Storage Used", value: formatBytes(summary.totalStorageBytes) },
    { label: "Window", value: `${formatNumber(summary.activeWindowDays)} days` },
  ];

  const distributionCards = [
    { title: "Plan Distribution", data: summary.planDistribution },
    { title: "Auth Provider Distribution", data: summary.authProviderDistribution },
    {
      title: "Subscription Status Distribution",
      data: summary.subscriptionStatusDistribution,
    },
    {
      title: "Subscription Plan Distribution",
      data: summary.subscriptionPlanDistribution,
    },
  ];

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    const normalized = normalizeDashboardQuery(formValues);
    setQuery(normalized);
  };

  const handlePrevious = () => {
    setQuery((prev) =>
      normalizeDashboardQuery({
        activeDays: prev.activeDays,
        limit: prev.limit,
        offset: Math.max(0, prev.offset - prev.limit),
      })
    );
  };

  const handleNext = () => {
    setQuery((prev) =>
      normalizeDashboardQuery({
        activeDays: prev.activeDays,
        limit: prev.limit,
        offset: prev.offset + prev.limit,
      })
    );
  };

  const loadingState = loading && !data;

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Overview</h2>
            <p className="muted">Live metrics from `/api/admin/dashboard`.</p>
          </div>

          <p className="muted">
            Generated: {formatDateTime(data?.generatedAt || summary.generatedAt)}
          </p>
        </div>

        <form className="filter-row" onSubmit={handleApplyFilters}>
          <label>
            Active window (days)
            <input
              className="input"
              name="activeDays"
              type="number"
              min="1"
              max="3650"
              value={formValues.activeDays}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Limit
            <input
              className="input"
              name="limit"
              type="number"
              min="1"
              max="500"
              value={formValues.limit}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Offset
            <input
              className="input"
              name="offset"
              type="number"
              min="0"
              value={formValues.offset}
              onChange={handleFilterChange}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </button>
        </form>

        {error ? <p className="error-banner">{error}</p> : null}
      </section>

      <section className="summary-grid">
        {summaryCards.map((item) => (
          <article key={item.label} className="metric-card">
            <p className="muted">{item.label}</p>
            <p className="metric-value">{loadingState ? "..." : item.value}</p>
          </article>
        ))}
      </section>

      <section className="chart-grid">
        <DonutChartCard
          title="Plan Split"
          series={planSeries}
          emptyMessage="No plan distribution data"
          valueFormatter={formatNumber}
        />
        <DonutChartCard
          title="Auth Provider Split"
          series={authSeries}
          emptyMessage="No provider data"
          valueFormatter={formatNumber}
        />
        <DonutChartCard
          title="Subscription Status Split"
          series={subscriptionStatusSeries}
          emptyMessage="No subscription status data"
          valueFormatter={formatNumber}
        />
        <BarChartCard
          title="Content Totals"
          series={contentSeries}
          emptyMessage="No content totals available"
          valueFormatter={formatNumber}
        />
        <BarChartCard
          title="User Status Overview"
          series={userStateSeries}
          emptyMessage="No user status data"
          valueFormatter={formatNumber}
        />
      </section>

      <section className="distribution-grid">
        {distributionCards.map((distribution) => (
          <article key={distribution.title} className="panel">
            <h3>{distribution.title}</h3>
            <div className="kv-list">
              {Object.entries(distribution.data || {}).length ? (
                Object.entries(distribution.data || {}).map(([key, value]) => (
                  <div key={key} className="kv-row">
                    <span>{key}</span>
                    <strong>{formatNumber(value)}</strong>
                  </div>
                ))
              ) : (
                <p className="muted">No data available</p>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Users</h2>
            <p className="muted">Paginated user details from admin dashboard response.</p>
          </div>
          <p className="muted">
            Showing {formatNumber(users.length)} of {formatNumber(data?.totalUsers ?? 0)}
          </p>
        </div>

        <div className="table-wrap desktop-only">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Auth</th>
                <th>Verified</th>
                <th>Onboarding</th>
                <th>Active</th>
                <th>Logins</th>
                <th>Last login</th>
                <th>Projects</th>
                <th>Briefs</th>
                <th>Documents</th>
                <th>Storage</th>
                <th>Plan</th>
                <th>Payment</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user) => (
                  <tr key={user.userId}>
                    <td>{user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "-"}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.authProvider || "-"}</td>
                    <td>{user.verified ? "Yes" : "No"}</td>
                    <td>{user.onboardingCompleted ? "Yes" : "No"}</td>
                    <td>{user.active ? "Yes" : "No"}</td>
                    <td>{formatNumber(user.loginCountInWindow)}</td>
                    <td>{formatDateTime(user.lastLoginAt)}</td>
                    <td>{formatNumber(user.projectCount)}</td>
                    <td>{formatNumber(user.briefCount)}</td>
                    <td>{formatNumber(user.documentCount)}</td>
                    <td>{formatBytes(user.storageBytes)}</td>
                    <td>{user.planName || user.subscriptionPlanName || "-"}</td>
                    <td>{user.paymentStatus || "-"}</td>
                    <td>{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={15} className="table-empty">
                    {loading ? "Loading users..." : "No users found for this filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mobile-only mobile-list">
          {users.length ? (
            users.map((user) => (
              <article key={`mobile-${user.userId}`} className="mobile-data-card">
                <div className="mobile-card-head">
                  <h4>{user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "-"}</h4>
                  <span className="pill">{user.planName || user.subscriptionPlanName || "-"}</span>
                </div>
                <div className="mobile-card-grid">
                  <p>
                    <small>Email</small>
                    <span>{user.email || "-"}</span>
                  </p>
                  <p>
                    <small>Auth</small>
                    <span>{user.authProvider || "-"}</span>
                  </p>
                  <p>
                    <small>Active</small>
                    <span>{user.active ? "Yes" : "No"}</span>
                  </p>
                  <p>
                    <small>Verified</small>
                    <span>{user.verified ? "Yes" : "No"}</span>
                  </p>
                  <p>
                    <small>Projects</small>
                    <span>{formatNumber(user.projectCount)}</span>
                  </p>
                  <p>
                    <small>Documents</small>
                    <span>{formatNumber(user.documentCount)}</span>
                  </p>
                  <p>
                    <small>Storage</small>
                    <span>{formatBytes(user.storageBytes)}</span>
                  </p>
                  <p>
                    <small>Payment</small>
                    <span>{user.paymentStatus || "-"}</span>
                  </p>
                </div>
                <p className="muted">Last login: {formatDateTime(user.lastLoginAt)}</p>
              </article>
            ))
          ) : (
            <p className="table-empty">{loading ? "Loading users..." : "No users found for this filter."}</p>
          )}
        </div>

        <div className="pagination-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrevious}
            disabled={loading || query.offset <= 0}
          >
            Previous
          </button>

          <p className="muted">
            Offset {formatNumber(data?.offset ?? query.offset)} | Limit {formatNumber(data?.limit ?? query.limit)}
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNext}
            disabled={loading || !data?.hasMore}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
