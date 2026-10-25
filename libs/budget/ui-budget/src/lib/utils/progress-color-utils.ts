// spec: docs/qa/2026-10-21-ui-ux-audit.md

/**
 * Returns a color based on budget progress percentage.
 * - < 80%  → green  (#4caf50)
 * - 80–99% → yellow (#ff9800)
 * - ≥ 100% → red    (#f44336)
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) {
    return '#f44336';
  }
  if (percentage >= 80) {
    return '#ff9800';
  }
  return '#4caf50';
}

/**
 * Returns a CSS linear-gradient from green→yellow→red based on percentage.
 * The gradient maps:
 *   0%   → green (#4caf50)
 *   50%  → yellow-green (#cddc39)
 *   100% → red (#f44336)
 */
export function getProgressGradient(percentage: number): string {
  const pct = Math.max(0, Math.min(100, percentage));
  if (pct <= 50) {
    // green → yellow-green
    const t = pct / 50;
    return `linear-gradient(90deg, #4caf50 0%, #cddc39 ${t * 100}%)`;
  }
  // yellow-green → orange → red
  const t = (pct - 50) / 50;
  return `linear-gradient(90deg, #cddc39 0%, #ff9800 ${t * 50}%, #f44336 ${t * 100}%)`;
}