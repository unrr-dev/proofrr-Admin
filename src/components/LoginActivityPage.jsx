import { useEffect, useState } from "react";
import { BarChartCard, DonutChartCard } from "./Charts.jsx";
import { ApiError } from "../services/apiClient.js";
import { fetchLoginActivity, normalizeLoginActivityQuery } from "../services/adminService.js";
import { toSeriesFromObject } from "../utils/chartSeries.js";

const formatDateTime = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function LoginActivityPage({ token, onUnauthorized }) {
  const [formValues, setFormValues] = useState({
    days: "30",
    limit: "100",
  });
  const [query, setQuery] = useState(() =>
    normalizeLoginActivityQuery({
      days: 30,
      limit: 100,
    })
  );

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetchLoginActivity({ token, ...query });
        if (cancelled) return;

        setRecords(Array.isArray(response) ? response : []);
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

        setError(requestError?.message || "Failed to load login activity.");
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

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApply = (event) => {
    event.preventDefault();
    setQuery(normalizeLoginActivityQuery(formValues));
  };

  const providerDistribution = records.reduce((acc, record) => {
    const key = record?.provider || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const methodDistribution = records.reduce((acc, record) => {
    const key = record?.loginMethod || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const hourlyBuckets = [
    { label: "00-04", start: 0, end: 4 },
    { label: "04-08", start: 4, end: 8 },
    { label: "08-12", start: 8, end: 12 },
    { label: "12-16", start: 12, end: 16 },
    { label: "16-20", start: 16, end: 20 },
    { label: "20-24", start: 20, end: 24 },
  ];

  const bucketSeries = hourlyBuckets.map((bucket, index) => {
    const count = records.reduce((sum, record) => {
      if (!record?.loginAt) return sum;
      const date = new Date(record.loginAt);
      if (Number.isNaN(date.getTime())) return sum;
      const hour = date.getHours();
      if (hour >= bucket.start && hour < bucket.end) {
        return sum + 1;
      }
      return sum;
    }, 0);

    const colors = ["#0c6ce8", "#08a88a", "#ff9f1c", "#ef476f", "#7c3aed", "#1d3557"];
    return {
      label: bucket.label,
      value: count,
      color: colors[index % colors.length],
    };
  });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Login Activity</h2>
            <p className="muted">Data from `/api/admin/dashboard/login-activity`.</p>
          </div>
          <p className="muted">Rows: {records.length}</p>
        </div>

        <form className="filter-row" onSubmit={handleApply}>
          <label>
            Days
            <input
              className="input"
              type="number"
              name="days"
              min="1"
              max="3650"
              value={formValues.days}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            Limit
            <input
              className="input"
              type="number"
              name="limit"
              min="1"
              max="500"
              value={formValues.limit}
              onChange={handleFilterChange}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </button>
        </form>

        {error ? <p className="error-banner">{error}</p> : null}
      </section>

      <section className="chart-grid">
        <DonutChartCard
          title="Provider Split"
          series={toSeriesFromObject(providerDistribution)}
          emptyMessage="No login providers in selected range"
          valueFormatter={(value) => String(value)}
        />
        <DonutChartCard
          title="Login Method Split"
          series={toSeriesFromObject(methodDistribution)}
          emptyMessage="No login methods in selected range"
          valueFormatter={(value) => String(value)}
        />
        <BarChartCard
          title="Login Time Buckets"
          series={bucketSeries}
          emptyMessage="No login timestamps available"
          valueFormatter={(value) => String(value)}
        />
      </section>

      <section className="panel">
        <div className="table-wrap desktop-only">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Provider</th>
                <th>Method</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Login At</th>
              </tr>
            </thead>
            <tbody>
              {records.length ? (
                records.map((record, index) => (
                  <tr key={`${record.userId}-${record.loginAt}-${index}`}>
                    <td>{record.fullName || [record.firstName, record.lastName].filter(Boolean).join(" ") || "-"}</td>
                    <td>{record.email || "-"}</td>
                    <td>{record.provider || "-"}</td>
                    <td>{record.loginMethod || "-"}</td>
                    <td>{record.ipAddress || "-"}</td>
                    <td className="truncate" title={record.userAgent || ""}>
                      {record.userAgent || "-"}
                    </td>
                    <td>{formatDateTime(record.loginAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="table-empty">
                    {loading ? "Loading activity..." : "No login activity found for this range."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mobile-only mobile-list">
          {records.length ? (
            records.map((record, index) => (
              <article
                key={`mobile-login-${record.userId}-${record.loginAt}-${index}`}
                className="mobile-data-card"
              >
                <div className="mobile-card-head">
                  <h4>{record.fullName || [record.firstName, record.lastName].filter(Boolean).join(" ") || "-"}</h4>
                  <span className="pill">{record.provider || "-"}</span>
                </div>
                <div className="mobile-card-grid">
                  <p>
                    <small>Email</small>
                    <span>{record.email || "-"}</span>
                  </p>
                  <p>
                    <small>Method</small>
                    <span>{record.loginMethod || "-"}</span>
                  </p>
                  <p>
                    <small>IP</small>
                    <span>{record.ipAddress || "-"}</span>
                  </p>
                  <p>
                    <small>Login At</small>
                    <span>{formatDateTime(record.loginAt)}</span>
                  </p>
                </div>
                <p className="muted">Agent: {record.userAgent || "-"}</p>
              </article>
            ))
          ) : (
            <p className="table-empty">
              {loading ? "Loading activity..." : "No login activity found for this range."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
