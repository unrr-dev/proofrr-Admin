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

const normalizeValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const toSeriesFromObject = (distribution = {}) => {
  return Object.entries(distribution || {})
    .map(([label, rawValue], index) => ({
      label,
      value: normalizeValue(rawValue),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .filter((item) => item.value > 0);
};
