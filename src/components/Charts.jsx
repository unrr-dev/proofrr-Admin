const CHART_COLORS = [
  "#0c6ce8",
  "#08a88a",
  "#ff9f1c",
  "#ef476f",
  "#7c3aed",
  "#1d3557",
  "#4cc9f0",
  "#8ac926",
];

const buildConicGradient = (series = []) => {
  const total = series.reduce((sum, item) => sum + item.value, 0);
  if (!total) {
    return "conic-gradient(#d9e9ff 0deg 360deg)";
  }

  let current = 0;
  const parts = series.map((item) => {
    const start = current;
    const angle = (item.value / total) * 360;
    const end = start + angle;
    current = end;
    return `${item.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${parts.join(", ")})`;
};

const formatPercent = (value, total) => {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

export function DonutChartCard({
  title,
  series,
  emptyMessage = "No data available",
  valueFormatter = (value) => String(value),
}) {
  const total = series.reduce((sum, item) => sum + item.value, 0);
  const gradient = buildConicGradient(series);

  return (
    <article className="panel chart-card">
      <h3>{title}</h3>

      {total ? (
        <div className="donut-layout">
          <div className="donut" style={{ background: gradient }} aria-hidden="true">
            <div className="donut-hole">
              <span>Total</span>
              <strong>{valueFormatter(total)}</strong>
            </div>
          </div>

          <div className="legend-list">
            {series.map((item) => (
              <div key={item.label} className="legend-row">
                <span className="legend-key" title={item.label}>
                  <span className="swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <span className="legend-label">{item.label}</span>
                </span>
                <span className="legend-meta">
                  <strong>{valueFormatter(item.value)}</strong>
                  <small>{formatPercent(item.value, total)}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted">{emptyMessage}</p>
      )}
    </article>
  );
}

export function BarChartCard({
  title,
  series,
  emptyMessage = "No data available",
  valueFormatter = (value) => String(value),
}) {
  const maxValue = series.reduce((max, item) => Math.max(max, item.value), 0);

  return (
    <article className="panel chart-card">
      <h3>{title}</h3>

      {maxValue ? (
        <div className="bar-chart-list">
          {series.map((item, index) => {
            const ratio = maxValue ? (item.value / maxValue) * 100 : 0;
            const color = item.color || CHART_COLORS[index % CHART_COLORS.length];

            return (
              <div key={item.label} className="bar-row">
                <div className="bar-row-head">
                  <span className="bar-label" title={item.label}>
                    {item.label}
                  </span>
                  <strong>{valueFormatter(item.value)}</strong>
                </div>
                <div className="bar-track" aria-hidden="true">
                  <div className="bar-fill" style={{ width: `${ratio}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">{emptyMessage}</p>
      )}
    </article>
  );
}
