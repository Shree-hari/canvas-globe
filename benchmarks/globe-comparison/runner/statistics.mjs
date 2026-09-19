export function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index];
}

export function distribution(values) {
  const samples = values.filter(Number.isFinite);
  return {
    median: percentile(samples, 0.5),
    p95: percentile(samples, 0.95),
    samples,
  };
}

